// ─────────────────────────────────────────────────────────────
// PricesPage.jsx
// Stylish Live Prices + TradingView-style Chart Layout
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { C } from "../constants.jsx";
import {
  Card,
  SectionTitle,
  ChartWrap,
  FG,
  Sel,
  Btn,
} from "../shared/Shared.jsx";

import { fp, fpc, f2 } from "../utils/utils.js";
import { CandleChart1, PAIRS, TFS } from "../components/Charts.jsx";

const WS =
  "ws://localhost:8766/prices/live?pairs=EURUSD,GBPUSD,USDJPY,AUDUSD,USDCAD,XAUUSD,BTCUSD,GBPJPY";

export default function PricesPage({ api }) {
  const [prices, setPrices] = useState([]);
  const [selP, setSelP] = useState("EURUSD");
  const [selTf, setSelTf] = useState("H1");
  const [bars, setBars] = useState([]);
  const [busy, setBusy] = useState(false);
    const [liveTick, setLiveTick] = useState(null);

  const ws = useRef(null);

  useEffect(() => {
    const sock = new WebSocket(WS);

    sock.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.data) setPrices(d.data);
      } catch {}
    };

    ws.current = sock;

    const poll = () =>
      api
        .get("/prices/live")
        .then((d) => {
          if (!ws.current || ws.current.readyState !== 1) {
            setPrices(d.prices || []);
          }
        })
        .catch(() => {});

    poll();

    const t = setInterval(poll, 8000);

    return () => {
      clearInterval(t);
      sock.close();
    };
  }, []);



useEffect(() => {
  const sock = new WebSocket(
    "ws://localhost:8000/ws/prices"
  );

  sock.onmessage = (e) => {
    const d = JSON.parse(e.data);

    if (d.type === "tick") {
      setLiveTick(d);
    }
  };

  return () => sock.close();
}, []);

  const loadChart = async () => {
    setBusy(true);

    try {
      const d = await api.get(
        `/prices/chart?pair=${selP}&timeframe=${selTf}&candles=120`
      );

      setBars(d.candles || []);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadChart();
  }, [selP, selTf]);

  return (
    <div
      style={{
        padding: 20,
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        gap: 18,
        minHeight: "100vh",
        background: "#071018",
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

          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 99,
              background: "#22c55e",
              boxShadow: "0 0 10px #22c55e",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            maxHeight: "82vh",
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
                  {p.pair === "BTCUSD"
                    ? f2(p.price)
                    : fp(p.price)}
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
                      {fp(p.bid, 4)}
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
                      {fp(p.ask, 4)}
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
        </div>
      </Card>

      {/* ───────── RIGHT CHART PANEL ───────── */}
      <Card
        style={{
          background: "#0b1723",
          border: "1px solid #1f2937",
          padding: 18,
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
              {selP}
            </div>

            <div
              style={{
                color: "#94a3b8",
                marginTop: 4,
                fontSize: 13,
              }}
            >
              EMA20 · EMA50 · Bollinger Bands
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

            <div style={{ minWidth: 110 }}>
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
          </div>
        </div>

        {/* Indicator Legend */}
        <div
          style={{
            display: "flex",
            gap: 18,
            marginBottom: 14,
            flexWrap: "wrap",
            fontSize: 12,
          }}
        >
          <Legend color="#facc15" label="EMA 20" />
          <Legend color="#a855f7" label="EMA 50" />
          <Legend color="#60a5fa" label="BB Upper" />
          <Legend color="#3b82f6" label="BB Lower" />
        </div>

        {/* Chart */}
        <ChartWrap>
          <CandleChart1 bars={bars}  timeframe={selTf}
  livePrice={liveTick}/>
        </ChartWrap>
      </Card>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "#cbd5e1",
      }}
    >
      <div
        style={{
          width: 14,
          height: 3,
          borderRadius: 999,
          background: color,
        }}
      />
      {label}
    </div>
  );
}