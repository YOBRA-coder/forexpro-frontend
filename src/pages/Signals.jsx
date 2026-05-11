// ─── Signals ──────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { C } from "../constants.jsx";
import { Card, SectionTitle, Grid, Btn, Sel, FG, Pill } from "../shared/Shared.jsx";
import { fp, f1 } from "../utils/utils.js";
import { CandleChart1, ConfRing, SigCard } from "../components/Charts.jsx";
import { PAIRS, TFS } from "../components/Charts.jsx";
import { ChartWrap, Badge } from "../shared/Shared.jsx";

export default function Signals({ api }) {
  const [pair,    setPair]    = useState("EURUSD");
  const [tf,      setTf]      = useState("H1");
  const [sigs,    setSigs]    = useState([]);
  const [sel,     setSel]     = useState(null);
  const [bars,    setBars]    = useState([]);
  const [busy,    setBusy]    = useState(false);
  const [bulkP,   setBulkP]   = useState(["EURUSD","GBPUSD","USDJPY","XAUUSD"]);
  const [bulkTf,  setBulkTf]  = useState(["H1","H4"]);
  const [minConf, setMinConf] = useState(0);
  const [dirF,    setDirF]    = useState("ALL");
  const [subTab,  setSubTab]  = useState("gen"); // gen | history
  const [hPair,   setHPair]   = useState("EURUSD");
  const [hTf,     setHTf]     = useState("H1");
  const [hPer,    setHPer]    = useState("1M");
  const [hData,   setHData]   = useState(null);
  const [hBusy,   setHBusy]   = useState(false);

  // Fetch chart when signal selected
  useEffect(() => {
    if (!sel) return;
    api.get(`/prices/chart?pair=${sel.pair}&timeframe=${sel.timeframe}&candles=80`)
      .then(d => setBars(d.candles || [])).catch(() => {});
  }, [sel, api]);

  // Load latest on mount
  useEffect(() => {
    api.get("/signals/latest?limit=20").then(d => setSigs(d.signals || [])).catch(() => {});
  }, []);

  const generate = async () => {
    setBusy(true);
    try {
      const s = await api.post("/signals/generate", { pair, timeframe: tf });
      setSigs(p => [s, ...p.slice(0, 19)]);
      setSel(s);
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const bulk = async () => {
    setBusy(true);
    try {
      const d = await api.post("/signals/bulk", { pairs: bulkP, timeframes: bulkTf, min_confidence: minConf, direction_filter: dirF });
      const list = d.signals || [];
      setSigs(list);
      if (list.length) setSel(list[0]);
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const loadHistory = async () => {
    setHBusy(true);
    try { const d = await api.get(`/signals/history?pair=${hPair}&timeframe=${hTf}&period=${hPer}`); setHData(d); }
    catch (e) { alert(e.message); }
    finally { setHBusy(false); }
  };

  // Signal detail panel
  const Detail = ({ s }) => {
    if (!s) return (
      <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <span style={{ color: C.muted, fontSize: 13 }}>Select or generate a signal to view details</span>
      </Card>
    );
    const buy = s.direction === "BUY";
    const dc  = buy ? C.green : C.red;
    return (
      <Card>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>
              {s.pair} <span style={{ color: dc }}>{s.direction}</span>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{s.timeframe} · {s.entry_time}</div>
          </div>
          <ConfRing val={s.confidence} size={60} />
        </div>

        {/* Metric grid */}
        <Grid cols="repeat(6,1fr)" gap={10} style={{ marginBottom: 13 }}>
          {[["ENTRY", fp(s.entry_price), C.text], ["STOP LOSS", fp(s.stop_loss), C.red], ["TAKE PROFIT", fp(s.take_profit), C.green],
            ["SL PIPS", f1(s.sl_pips), C.red], ["TP PIPS", f1(s.tp_pips), C.green], ["R:R", `1:${s.risk_reward}`, C.gold],
          ].map(([l, v, c]) => (
            <div key={l} style={{ background: C.surf2, border: `1px solid ${C.border}`, borderTop: `2px solid ${c}`, borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: 0.5, marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c, fontFamily: "monospace" }}>{v}</div>
            </div>
          ))}
        </Grid>

        {/* Chart */}
        <ChartWrap label={`${s.pair} · ${s.timeframe}  |  — EMA20 (gold)  — EMA50 (purple)  - - BB (blue)`}>
          <CandleChart1 bars={bars} entry={s.entry_price} sl={s.stop_loss} tp={s.take_profit} />
        </ChartWrap>

        {/* Indicators + AI side by side */}
        <Grid cols="1fr 1fr" gap={12}>
          <ChartWrap label="Technical Indicators">
            {[["RSI",     s.rsi,      0,   100],
              ["Stoch K", s.stoch_k,  0,   100],
              ["EMA 20",  s.ema20,    null, null],
              ["EMA 50",  s.ema50,    null, null],
              ["EMA 200", s.ema200,   null, null],
              ["BB Upper",s.bb_upper, null, null],
              ["BB Lower",s.bb_lower, null, null],
              ["ATR",     s.atr,      null, null],
            ].map(([l, v, lo, hi]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: `1px solid ${C.border}20`, fontSize: 11 }}>
                <span style={{ width: 68, color: C.muted, fontSize: 10, flexShrink: 0 }}>{l}</span>
                <span style={{ width: 72, textAlign: "right", fontFamily: "monospace", fontWeight: 600, flexShrink: 0 }}>{hi != null ? f1(v) : fp(v)}</span>
                {hi != null && (
                  <div style={{ flex: 1, height: 3, background: C.border, borderRadius: 2 }}>
                    <div style={{ width: `${Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100)).toFixed(0)}%`, height: "100%", background: C.gold, borderRadius: 2 }} />
                  </div>
                )}
              </div>
            ))}
          </ChartWrap>

          <ChartWrap label="AI Analysis">
            <div style={{ fontSize: 12, lineHeight: 1.75, color: C.text, opacity: 0.88, marginBottom: 13 }}>{s.ai_analysis}</div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 6 }}>PATTERNS DETECTED</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              <Badge col={dc}>{s.candle_pattern}</Badge>
              <Badge col={C.blue}>{s.chart_pattern}</Badge>
            </div>
            <div style={{ border: `1px solid ${dc}40`, background: dc + "0e", borderRadius: 8, padding: 13 }}>
              <div style={{ fontSize: 9, color: dc, letterSpacing: 2, marginBottom: 7 }}>RECOMMENDATION</div>
              <div style={{ fontSize: 12, lineHeight: 1.85 }}>
                <strong>{s.direction}</strong> {s.pair} at <strong style={{ color: C.gold, fontFamily: "monospace" }}>{fp(s.entry_price)}</strong><br />
                SL: <strong style={{ color: C.red, fontFamily: "monospace" }}>{fp(s.stop_loss)}</strong> ({f1(s.sl_pips)} pips) &nbsp;
                TP: <strong style={{ color: C.green, fontFamily: "monospace" }}>{fp(s.take_profit)}</strong> ({f1(s.tp_pips)} pips)<br />
                Best time: <strong style={{ color: C.gold }}>{s.entry_time}</strong>
              </div>
            </div>
          </ChartWrap>
        </Grid>
      </Card>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Sub tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Btn col={subTab === "gen" ? C.gold : C.muted} ghost={subTab !== "gen"} onClick={() => setSubTab("gen")} style={{ fontSize: 11, padding: "6px 14px" }}>⚡ Generate</Btn>
        <Btn col={subTab === "history" ? C.gold : C.muted} ghost={subTab !== "history"} onClick={() => setSubTab("history")} style={{ fontSize: 11, padding: "6px 14px" }}>📊 History</Btn>
      </div>

      {subTab === "gen" && (
        <Grid cols="290px 1fr" gap={16}>
          {/* Left controls */}
          <div>
            <Card>
              <SectionTitle>Single Signal</SectionTitle>
              <FG label="Pair"><Sel value={pair} onChange={e => setPair(e.target.value)} options={PAIRS} /></FG>
              <FG label="Timeframe"><Sel value={tf} onChange={e => setTf(e.target.value)} options={TFS} /></FG>
              <Btn col={C.gold} full onClick={generate} disabled={busy}>{busy ? "Generating…" : "⚡ Generate Signal"}</Btn>
            </Card>

            <Card>
              <SectionTitle>Bulk Generate</SectionTitle>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, marginBottom: 6 }}>PAIRS</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                {PAIRS.map(p => <Pill key={p} on={bulkP.includes(p)} onClick={() => setBulkP(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}>{p}</Pill>)}
              </div>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, marginBottom: 6 }}>TIMEFRAMES</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                {TFS.map(t => <Pill key={t} on={bulkTf.includes(t)} onClick={() => setBulkTf(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}>{t}</Pill>)}
              </div>
              <FG label="Direction">
                <div style={{ display: "flex", gap: 4 }}>
                  {["ALL","BUY","SELL"].map(d => <Pill key={d} on={dirF === d} onClick={() => setDirF(d)}>{d}</Pill>)}
                </div>
              </FG>
              <FG label={`Min Confidence: ${minConf}%`}>
                <input type="range" min={0} max={90} step={5} value={minConf} onChange={e => setMinConf(+e.target.value)}
                  style={{ width: "100%", accentColor: C.gold }} />
              </FG>
              <Btn col={C.gold} ghost full onClick={bulk} disabled={busy}>{busy ? "Generating…" : "Generate All"}</Btn>
            </Card>

            <div style={{ maxHeight: 450, overflowY: "auto" }}>
              {sigs.map(s => <SigCard key={s.id} s={s} selected={sel?.id === s.id} onClick={() => setSel(s)} />)}
            </div>
          </div>

          {/* Right: detail */}
          <Detail s={sel} />
        </Grid>
      )}

      {subTab === "history" && (
        <Card>
          <SectionTitle>Signal History</SectionTitle>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "flex-end" }}>
            <div style={{ minWidth: 130 }}><FG label="Pair"><Sel value={hPair} onChange={e => setHPair(e.target.value)} options={PAIRS} /></FG></div>
            <div style={{ minWidth: 100 }}><FG label="Timeframe"><Sel value={hTf} onChange={e => setHTf(e.target.value)} options={TFS} /></FG></div>
            <FG label="Period">
              <div style={{ display: "flex", gap: 5 }}>
                {["1M","3M","6M","1Y"].map(p => <Pill key={p} on={hPer === p} onClick={() => setHPer(p)}>{p}</Pill>)}
              </div>
            </FG>
            <Btn col={C.gold} onClick={loadHistory} disabled={hBusy}>{hBusy ? "Loading…" : "Load"}</Btn>
          </div>

          {hData && (
            <>
              <Grid cols="repeat(4,minmax(0,1fr))" gap={12} style={{ marginBottom: 16 }}>
                <Stat label="Total"      value={hData.count}                                                  color={C.blue} />
                <Stat label="BUY"        value={hData.signals?.filter(s => s.direction === "BUY").length || 0} color={C.green} />
                <Stat label="SELL"       value={hData.signals?.filter(s => s.direction === "SELL").length || 0} color={C.red} />
                <Stat label="Est. Win Rate" value={`${hData.estimated_winrate}%`}                             color={C.gold} />
              </Grid>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 10 }}>
                {[...(hData.signals || [])].reverse().map((s, i) => (
                  <div key={i} style={{ background: C.surf2, border: `1px solid ${C.border}`, borderLeft: `3px solid ${s.direction === "BUY" ? C.green : C.red}`, borderRadius: 8, padding: 11 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <strong>{s.pair}</strong>
                        <Badge col={s.direction === "BUY" ? C.green : C.red}>{s.direction}</Badge>
                      </div>
                      <span style={{ color: C.gold, fontWeight: 700 }}>{s.confidence}%</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, fontSize: 11 }}>
                      <div><div style={{ fontSize: 9, color: C.muted }}>ENTRY</div><span style={{ fontFamily: "monospace" }}>{fp(s.entry_price)}</span></div>
                      <div><div style={{ fontSize: 9, color: C.muted }}>SL</div><span style={{ color: C.red, fontFamily: "monospace" }}>{fp(s.stop_loss)}</span></div>
                      <div><div style={{ fontSize: 9, color: C.muted }}>TP</div><span style={{ color: C.green, fontFamily: "monospace" }}>{fp(s.take_profit)}</span></div>
                    </div>
                    <div style={{ display: "flex", gap: 5, marginTop: 7 }}>
                      <Badge col={{ STRONG: C.green, MODERATE: C.gold, WEAK: "#f97316", AVOID: C.red }[s.strength] || C.muted}>{s.strength}</Badge>
                      <Badge col={C.muted}>1:{s.risk_reward}</Badge>
                    </div>
                    <div style={{ fontSize: 9, color: C.muted, marginTop: 5 }}>{String(s.generated_at || s.expires_at || "").slice(0, 16)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}