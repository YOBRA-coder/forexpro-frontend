// ─────────────────────────────────────────────────────────────
// PricesPage.jsx
// Stylish Live Prices + TradingView-style Chart Layout
// Real-time via /ws/prices (market list) and /ws/candles (selected chart)
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { C } from "../constants.jsx";
import {
  Card,
  SectionTitle,
  ChartWrap,
  FG,
  Sel,
  Btn,
  Badge,
  OkBox,
  ErrBox,
  useMobile,
} from "../shared/Shared.jsx";

import { fp, fpc, f2, usd } from "../utils/utils.js";
import { CandleChart1, PAIRS, FOREX_PAIRS, TFS, pairDecimals } from "../components/Charts.jsx";
import { WS_BASE } from "../api/Api.jsx";
import { useLiveSocket } from "../hooks/useLiveSocket.js";

const MARKET_LIST_PAIRS = ["EURUSD","GBPUSD","USDJPY","AUDUSD","USDCAD","USDCHF","NZDUSD","EURGBP","EURJPY","GBPJPY","EURAUD","AUDJPY","AUDNZD","CADJPY","CHFJPY","EURAUD","EURCAD","EURNZD","GBPAUD","GBPCAD","GBPNZD","NZDJPY"];

const PRICES_WS_URL = `${WS_BASE}/ws/prices?pairs=${MARKET_LIST_PAIRS.join(",")}`;

export default function PricesPage({ api }) {
  const [searchParams] = useSearchParams();
  const [prices, setPrices] = useState([]);
  const [selP, setSelP] = useState(() => searchParams.get("pair") || "EURUSD");
  const [selTf, setSelTf] = useState("H1");
  const [bars, setBars] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [sr, setSr] = useState([]);
  const [trendline, setTrendline] = useState(null);
  const [liveCandle, setLiveCandle] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(true); // mobile toggle — "Live Markets" panel can be collapsed to give the chart more room
  const [ind, setInd] = useState({ ema: true, bb: true, sr: true, trendline: true, volume: true });
  const [tradePanel, setTradePanel] = useState(false);
  const [lot, setLot] = useState(0.02);
  const [slPips, setSlPips] = useState(30);
  const [tpPips, setTpPips] = useState(60);
  const [tradeBusy, setTradeBusy] = useState(false);
  const [tradeMsg, setTradeMsg] = useState("");
  const [tradeErr, setTradeErr] = useState("");
  const [copyTrade, setCopyTrade] = useState(null); // the specific trade Dashboard linked here to show progress for
  const loadChartRef = useRef(null);
  const mobile = useMobile();

  // Deep link from Dashboard: /prices?pair=EURUSD&copyTradeId=44 — show that trade's progress
  const copyTradeId = searchParams.get("copyTradeId");
  useEffect(() => {
    if (!copyTradeId) { setCopyTrade(null); return; }
    api.get("/copy/my-trades").then(d => {
      const t = (d.trades || []).find(x => String(x.id) === copyTradeId);
      if (t) setCopyTrade(t);
    }).catch(() => {});
  }, [copyTradeId, api]);

  // ── Live market watchlist (left panel) ──
  const onPricesMsg = useCallback((d) => {
    if (d?.type === "prices" && Array.isArray(d.data)) setPrices(d.data);
  }, []);
  const priceStatus = useLiveSocket(PRICES_WS_URL, onPricesMsg);

  useEffect(() => {
    if (prices.length) return;
    api.get("/prices/live?pairs=" + MARKET_LIST_PAIRS.join(","))
      .then((d) => setPrices(d.prices || []))
      .catch(() => {});
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chart data (REST — full bar history + annotations) ──
  const loadChart = useCallback(async () => {
    setBusy(true);
    try {
      const d = await api.get(`/prices/chart?pair=${selP}&timeframe=${selTf}&candles=150`);
      setBars(d.candles || []);
      setMarkers(d.markers || []);
      setSr(d.support_resistance || []);
      setTrendline(d.trendline || null);
    } catch (e) {
      console.error(e.message);
    } finally {
      setBusy(false);
    }
  }, [api, selP, selTf]);
  loadChartRef.current = loadChart;

  useEffect(() => { loadChart(); }, [loadChart]);

  // ── Live candle stream for the pair/timeframe currently on screen ──
  const candleWsUrl = `${WS_BASE}/ws/candles?pair=${selP}&timeframe=${selTf}`;
  const onCandleMsg = useCallback((d) => {
    if (d?.type === "candle_update" && d.candle) {
      setLiveCandle(d.candle);
    } else if (d?.type === "candle_closed") {
      // A new bar formed — pull the fresh bar set + recomputed markers/S-R/trendline.
      loadChartRef.current && loadChartRef.current();
    }
  }, []);
  const candleStatus = useLiveSocket(candleWsUrl, onCandleMsg);

  const placeQuickTrade = async (direction) => {
    setTradeBusy(true); setTradeErr(""); setTradeMsg("");
    try {
      const res = await api.post("/trades/quick", { pair: selP, direction, lot_size: lot, sl_pips: slPips, tp_pips: tpPips });
      setTradeMsg(`✓ ${direction} ${selP} placed at ${res.entry_price} (SL ${res.stop_loss} / TP ${res.take_profit})`);
      setTimeout(() => setTradeMsg(""), 6000);
    } catch (e) { setTradeErr(e.message); }
    finally { setTradeBusy(false); }
  };

  return (
    <div
      style={{
        padding: mobile ? 10 : 20,
        display: "grid",
        gridTemplateColumns: mobile ? "1fr" : "320px 1fr",
        gap: mobile ? 12 : 18,
        minHeight: "100vh",
        background: "#071018",
        boxSizing: "border-box",
        width: "100%",
        overflowX: "hidden",
      }}
    >
      {/* ───────── LEFT MARKET PANEL ───────── */}
      <Card
        style={{
          padding: 14,
          background: "#0b1723",
          border: "1px solid #1f2937",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            marginBottom: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <SectionTitle>Live Markets</SectionTitle>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {mobile && (
              <button
                onClick={() => setShowWatchlist(s => !s)}
                style={{ background: "none", border: `1px solid #1f2937`, borderRadius: 6, color: "#94a3b8", fontSize: 11, padding: "4px 9px", cursor: "pointer" }}
              >
                {showWatchlist ? "Hide ▲" : "Show ▼"}
              </button>
            )}
            <div
              title={priceStatus === "open" ? "Live" : "Reconnecting…"}
              style={{
                width: 10,
                height: 10,
                borderRadius: 99,
                background: priceStatus === "open" ? "#22c55e" : "#475569",
                boxShadow: priceStatus === "open" ? "0 0 10px #22c55e" : "none",
                transition: "all .3s",
              }}
            />
          </div>
        </div>

        {(!mobile || showWatchlist) && <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            maxHeight: mobile ? "60vh" : "82vh",
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          {prices.map((p) => {
            const up = p.direction === "up";

            return (
              <div
                key={p.pair}
                onClick={() => setSelP(p.pair)}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  cursor: "pointer",
                  transition: "all .2s ease",
                  background:
                    selP === p.pair
                      ? "linear-gradient(135deg,#172554,#0f172a)"
                      : "#0f172a",

                  border:
                    selP === p.pair
                      ? "1px solid #facc15"
                      : "1px solid #1e293b",

                  boxShadow:
                    selP === p.pair
                      ? "0 0 18px rgba(250,204,21,.15)"
                      : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: "#fff",
                    }}
                  >
                    {p.pair}
                  </div>

                  <div
                    style={{
                      color: up ? "#22c55e" : "#ef4444",
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {fpc(p.change_pct)}
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 24,
                    fontWeight: 800,
                    color: "#f8fafc",
                    marginBottom: 12,
                  }}
                >
                  {fp(p.price, pairDecimals(p.pair))}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    fontSize: 11,
                  }}
                >
                  <div
                    style={{
                      background: "#111827",
                      padding: 8,
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ color: "#94a3b8" }}>Bid</div>
                    <div style={{ color: "#22c55e" }}>
                      {fp(p.bid, pairDecimals(p.pair))}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#111827",
                      padding: 8,
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ color: "#94a3b8" }}>Ask</div>
                    <div style={{ color: "#ef4444" }}>
                      {fp(p.ask, pairDecimals(p.pair))}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#64748b",
                    fontSize: 11,
                  }}
                >
                  <span>Spread {p.spread}p</span>
                  <span>{p.source}</span>
                </div>
              </div>
            );
          })}
        </div>}
      </Card>

      {/* ───────── RIGHT CHART PANEL ───────── */}
      <Card
        style={{
          background: "#0b1723",
          border: "1px solid #1f2937",
          padding: mobile ? 12 : 18,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#fff",
              }}
            >
              {selP} <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>· {pairDecimals(selP)}dp</span>
            </div>

            <div
              style={{
                color: "#94a3b8",
                marginTop: 4,
                fontSize: 13,
              }}
            >
              EMA20 · EMA50 · Bollinger Bands · S/R · Trendline · Volume
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 130 }}>
              <FG label="Pair">
                <Sel
                  value={selP}
                  onChange={(e) => setSelP(e.target.value)}
                  options={PAIRS}
                />
              </FG>
            </div>

            <div style={{ minWidth: 90 }}>
              <FG label="Timeframe">
                <Sel
                  value={selTf}
                  onChange={(e) => setSelTf(e.target.value)}
                  options={TFS}
                />
              </FG>
            </div>

            <Btn
              col={C.gold}
              onClick={loadChart}
              disabled={busy}
            >
              {busy ? "Loading..." : "Refresh"}
            </Btn>

            {FOREX_PAIRS.includes(selP) && (
              <Btn col={tradePanel ? C.muted : C.green} ghost={tradePanel} onClick={() => setTradePanel(v => !v)}>
                {tradePanel ? "Close Trade Panel" : "📈 Place Trade"}
              </Btn>
            )}
          </div>
        </div>

        {copyTrade && (
          <div style={{ background: `${C.gold}14`, border: `1px solid ${C.gold}40`, borderRadius: 8,
                        padding: 12, marginBottom: 16, fontSize: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              Tracking copy trade #{copyTrade.id} — {copyTrade.pair} {copyTrade.direction} · {(copyTrade.status || "").toUpperCase()}
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", color: "#94a3b8" }}>
              <span>Entry: <strong style={{ color: "#fff" }}>{fp(copyTrade.entry_price, pairDecimals(copyTrade.pair))}</strong></span>
              <span>SL: <strong style={{ color: C.red }}>{fp(copyTrade.stop_loss, pairDecimals(copyTrade.pair))}</strong></span>
              <span>TP: <strong style={{ color: C.green }}>{fp(copyTrade.take_profit, pairDecimals(copyTrade.pair))}</strong></span>
              {copyTrade.status === "closed" && (
                <span>P&L: <strong style={{ color: copyTrade.pnl_usd >= 0 ? C.green : C.red }}>{usd(copyTrade.pnl_usd)}</strong></span>
              )}
            </div>
          </div>
        )}

        {tradePanel && (
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <div style={{ width: 90 }}><FG label="Lot size"><input type="number" step="0.01" value={lot} onChange={e => setLot(Number(e.target.value))}
                style={{ width: "100%", padding: 8, background: "#111827", border: "1px solid #1e293b", borderRadius: 6, color: "#fff", fontSize: 12, boxSizing: "border-box" }} /></FG></div>
              <div style={{ width: 90 }}><FG label="SL pips"><input type="number" value={slPips} onChange={e => setSlPips(Number(e.target.value))}
                style={{ width: "100%", padding: 8, background: "#111827", border: "1px solid #1e293b", borderRadius: 6, color: "#fff", fontSize: 12, boxSizing: "border-box" }} /></FG></div>
              <div style={{ width: 90 }}><FG label="TP pips"><input type="number" value={tpPips} onChange={e => setTpPips(Number(e.target.value))}
                style={{ width: "100%", padding: 8, background: "#111827", border: "1px solid #1e293b", borderRadius: 6, color: "#fff", fontSize: 12, boxSizing: "border-box" }} /></FG></div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <Btn col={C.green} onClick={() => placeQuickTrade("BUY")} disabled={tradeBusy}>{tradeBusy ? "…" : "BUY"}</Btn>
                <Btn col={C.red} onClick={() => placeQuickTrade("SELL")} disabled={tradeBusy}>{tradeBusy ? "…" : "SELL"}</Btn>
              </div>
            </div>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>
              Fills at the current market price and deducts margin from your balance immediately — this is a real position, not a preview.
            </div>
            {tradeMsg && <OkBox msg={tradeMsg} />}
            <ErrBox msg={tradeErr} />
          </div>
        )}

        {/* Indicator toggles */}
        <div
          style={{
            display: "flex",
            gap: mobile ? 10 : 18,
            marginBottom: 14,
            flexWrap: "wrap",
            fontSize: 12,
          }}
        >
          <IndToggle on={ind.ema} onClick={() => setInd(p => ({ ...p, ema: !p.ema }))} colors={["#facc15", "#a855f7"]} label="EMA 20/50" />
          <IndToggle on={ind.bb} onClick={() => setInd(p => ({ ...p, bb: !p.bb }))} colors={["#60a5fa", "#3b82f6"]} label="Bollinger Bands" />
          <IndToggle on={ind.sr} onClick={() => setInd(p => ({ ...p, sr: !p.sr }))} colors={["#fb7185", "#34d399"]} label="Support / Resistance" />
          <IndToggle on={ind.trendline} onClick={() => setInd(p => ({ ...p, trendline: !p.trendline }))} colors={["#22c55e"]} label="Trendline" />
          <IndToggle on={ind.volume} onClick={() => setInd(p => ({ ...p, volume: !p.volume }))} colors={["#3d9eff"]} label="Volume" />
        </div>

        {/* Chart */}
        <ChartWrap>
          <CandleChart1
            bars={bars}
            resetKey={`${selP}_${selTf}`}
            pair={selP}
            entry={copyTrade?.entry_price}
            sl={copyTrade?.stop_loss}
            tp={copyTrade?.take_profit}
            markers={markers}
            supportResistance={sr}
            trendline={trendline}
            liveCandle={liveCandle}
            live={candleStatus === "open"}
            indicators={ind}
          />
        </ChartWrap>
      </Card>
    </div>
  );
}

function IndToggle({ on, onClick, colors, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        color: on ? "#cbd5e1" : "#475569",
        background: on ? "#111827" : "transparent",
        border: `1px solid ${on ? "#1e293b" : "transparent"}`,
        borderRadius: 999,
        padding: "5px 10px",
        cursor: "pointer",
        fontSize: 12,
      }}
    >
      <span style={{ display: "flex", gap: 2 }}>
        {colors.map((c, i) => (
          <span key={i} style={{ width: 10, height: 3, borderRadius: 999, background: on ? c : "#334155" }} />
        ))}
      </span>
      {label}
    </button>
  );
}
