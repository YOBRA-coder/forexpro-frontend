// ─── Confidence ring ──────────────────────────────────────────────────────────
import { C } from "../constants.jsx";
import { fp, f1 } from "../utils/utils.js";
import { Badge } from "../shared/Shared.jsx";
import { ago } from "../utils/utils.js";
import { useEffect, useRef } from "react";

import {
  createChart,
  CandlestickSeries,
  LineSeries,
} from "lightweight-charts";

function ConfRing({ val, size = 54 }) {
  const r   = size * 0.38;
  const cx  = size / 2;
  const cy  = size / 2;
  const sw  = size * 0.072;
  const col = val >= 80 ? C.green : val >= 65 ? C.gold : val >= 50 ? "#f97316" : C.red;
  const circ = 2 * Math.PI * r;
  const full = circ * 0.75;
  const arc  = circ * (val / 100) * 0.75;
  const off  = circ * 0.125;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={sw}
        strokeDasharray={`${full} ${circ}`} strokeDashoffset={-off} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={sw}
        strokeDasharray={`${arc} ${circ}`} strokeDashoffset={-off} strokeLinecap="round" />
      <text x={cx} y={cy + 1} textAnchor="middle" fill={col} fontSize={size * 0.22}
        fontWeight="700" dominantBaseline="middle">{val}</text>
      <text x={cx} y={cy + size * 0.21} textAnchor="middle" fill={C.muted} fontSize={size * 0.13}>CONF</text>
    </svg>
  );
}

// ─── Candle chart (SVG) ───────────────────────────────────────────────────────
function CandleChart({ bars = [], entry, sl, tp }) {
  if (!bars.length) return <p style={{ color: C.muted, textAlign: "center", padding: "24px 0", fontSize: 12 }}>Loading chart…</p>;
  const W = 600, H = 190, PL = 54, PR = 52, PT = 6, PB = 18;
  const cw = W - PL - PR, ch = H - PT - PB;
  const sl55 = bars.slice(-55);
  const allY = [
    ...sl55.flatMap(b => [b.high, b.low]),
    ...[entry, sl, tp].filter(Boolean),
  ];
  const mn = Math.min(...allY), mx = Math.max(...allY), rng = mx - mn || 1;
  const Y   = v => PT + ch * (1 - (v - mn) / rng);
  const gap = cw / sl55.length;
  const bw  = Math.max(2, gap * 0.64);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = PT + ch * t, p = (mx - rng * t).toFixed(5);
        return (
          <g key={t}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke={C.border} strokeWidth=".4" />
            <text x={PL - 3} y={y + 3} fill={C.muted} fontSize="8" textAnchor="end">{p}</text>
          </g>
        );
      })}
      {/* Candles */}
      {sl55.map((b, i) => {
        const x    = PL + i * gap + gap / 2;
        const bull = b.close >= b.open;
        const col  = bull ? C.green : C.red;
        const oy   = Y(Math.max(b.open, b.close));
        const bh   = Math.max(1.5, Math.abs(Y(b.open) - Y(b.close)));
        return (
          <g key={i}>
            <line x1={x} y1={Y(b.high)} x2={x} y2={Y(b.low)} stroke={col} strokeWidth=".9" opacity=".7" />
            <rect x={x - bw / 2} y={oy} width={bw} height={bh}
              fill={bull ? C.green + "30" : C.red + "30"} stroke={col} strokeWidth=".9" />
          </g>
        );
      })}
      {/* Indicator lines */}
      {[
        [b => b.ema20,  C.gold,   1.2, ""],
        [b => b.ema50,  C.purple, 1.2, ""],
        [b => b.bb_up,  C.blue,   0.7, "3,2"],
        [b => b.bb_low, C.blue,   0.7, "3,2"],
      ].map(([fn, col, sw, dash], ki) => {
        const pts = sl55.map((b, i) => {
          const v = fn(b); return v ? `${PL + i * gap + gap / 2},${Y(v)}` : null;
        }).filter(Boolean).join(" ");
        return pts
          ? <polyline key={ki} points={pts} fill="none" stroke={col} strokeWidth={sw} strokeDasharray={dash} opacity=".85" />
          : null;
      })}
      {/* Signal price lines */}
      {[[entry, C.gold, "ENTRY"], [sl, C.red, "SL"], [tp, C.green, "TP"]].filter(([v]) => v).map(([v, col, lbl]) => (
        <g key={lbl}>
          <line x1={PL} y1={Y(v)} x2={W - PR} y2={Y(v)} stroke={col} strokeWidth="1" strokeDasharray="5,3" />
          <text x={W - PR + 3} y={Y(v) + 4} fill={col} fontSize="8">{lbl}</text>
        </g>
      ))}
    </svg>
  );
}



// ─────────────────────────────────────────────────────────────
// CandleChart1.jsx
// Advanced Professional Chart Styling
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// CandleChart1.jsx
// FULLY WORKING — lightweight-charts v5+
// Professional Forex Trading Chart
// ─────────────────────────────────────────────────────────────


// Backend annotation timestamps look like "2026-07-06 06:44" (naive UTC).
// The candle series uses integer unix seconds, so every overlay (markers,
// trendline, S/R) needs to be converted onto that same time axis.
function toUnixTime(s) {
  if (s == null) return null;
  if (typeof s === "number") return s;
  const iso = s.includes("T") ? s : s.replace(" ", "T") + (s.length <= 16 ? ":00" : "");
  const ms = Date.parse(iso.endsWith("Z") ? iso : iso + "Z");
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

export default function CandleChart1({
  bars = [],
  entry, sl, tp,
  markers = [],
  supportResistance = [],
  trendline = null,
  liveCandle = null,   // { time, open, high, low, close } — forming/closed bar from /ws/candles
  live = false,        // shows a small pulsing "LIVE" badge
  resetKey = "",        // change this (e.g. `${pair}_${timeframe}`) to force a full chart rebuild
}) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const lastBarTimeRef = useRef(null);

  // ── Full (re)build: runs on mount and whenever the pair/timeframe/bar-set changes ──
  useEffect(() => {
    if (!ref.current) return;
    if (!bars.length) return;

    const chart = createChart(ref.current, {
      width: ref.current.clientWidth,
      height: 560,
      layout: { background: { color: "#071018" }, textColor: "#94a3b8", fontFamily: "Inter, sans-serif", fontSize: 12 },
      grid: { vertLines: { color: "rgba(255,255,255,0.05)" }, horzLines: { color: "rgba(255,255,255,0.05)" } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "#1e293b" },
      timeScale: { borderColor: "#1e293b", timeVisible: true, secondsVisible: false },
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e", downColor: "#ef4444",
      borderUpColor: "#22c55e", borderDownColor: "#ef4444",
      wickUpColor: "#22c55e", wickDownColor: "#ef4444",
      priceLineVisible: true,
    });
    candleSeriesRef.current = candleSeries;

    const candleData = bars.map((b) => ({
      time: b.time, open: Number(b.open), high: Number(b.high), low: Number(b.low), close: Number(b.close),
    }));
    candleSeries.setData(candleData);
    lastBarTimeRef.current = candleData.length ? candleData[candleData.length - 1].time : null;

    // EMA20 / EMA50
    if (bars.some((b) => b.ema20 != null)) {
      const s = chart.addSeries(LineSeries, { color: "#facc15", lineWidth: 2, priceLineVisible: false, lastValueVisible: true, title: "EMA20" });
      s.setData(bars.filter((b) => b.ema20 != null).map((b) => ({ time: b.time, value: Number(b.ema20) })));
    }
    if (bars.some((b) => b.ema50 != null)) {
      const s = chart.addSeries(LineSeries, { color: "#a855f7", lineWidth: 2, priceLineVisible: false, lastValueVisible: true, title: "EMA50" });
      s.setData(bars.filter((b) => b.ema50 != null).map((b) => ({ time: b.time, value: Number(b.ema50) })));
    }
    // Bollinger bands
    if (bars.some((b) => b.bb_upper ?? b.bb_up)) {
      const s = chart.addSeries(LineSeries, { color: "#60a5fa", lineWidth: 1, lineStyle: 2, priceLineVisible: false });
      s.setData(bars.filter((b) => (b.bb_upper ?? b.bb_up) != null).map((b) => ({ time: b.time, value: Number(b.bb_upper ?? b.bb_up) })));
    }
    if (bars.some((b) => b.bb_lower ?? b.bb_low)) {
      const s = chart.addSeries(LineSeries, { color: "#3b82f6", lineWidth: 1, lineStyle: 2, priceLineVisible: false });
      s.setData(bars.filter((b) => (b.bb_lower ?? b.bb_low) != null).map((b) => ({ time: b.time, value: Number(b.bb_lower ?? b.bb_low) })));
    }

    // ── Entry / Stop Loss / Take Profit — native price lines with labels ──
    const priceLines = [];
    if (entry) priceLines.push(candleSeries.createPriceLine({ price: Number(entry), color: "#f0b429", lineWidth: 2, lineStyle: 2, axisLabelVisible: true, title: "ENTRY" }));
    if (sl)    priceLines.push(candleSeries.createPriceLine({ price: Number(sl),    color: "#ef4444", lineWidth: 2, lineStyle: 2, axisLabelVisible: true, title: "SL" }));
    if (tp)    priceLines.push(candleSeries.createPriceLine({ price: Number(tp),    color: "#22c55e", lineWidth: 2, lineStyle: 2, axisLabelVisible: true, title: "TP" }));

    // ── Support / Resistance — dashed horizontal levels ──
    (supportResistance || []).forEach((lvl) => {
      const isRes = lvl.type === "resistance";
      priceLines.push(candleSeries.createPriceLine({
        price: Number(lvl.price),
        color: isRes ? "#fb7185" : "#34d399",
        lineWidth: 1, lineStyle: 3, axisLabelVisible: true,
        title: isRes ? "Resistance" : "Support",
      }));
    });

    // ── Trendline — a 2-point line series through recent swing highs/lows ──
    let trendSeries = null;
    if (trendline?.p1 && trendline?.p2) {
      const t1 = toUnixTime(trendline.p1.time), t2 = toUnixTime(trendline.p2.time);
      if (t1 != null && t2 != null) {
        trendSeries = chart.addSeries(LineSeries, {
          color: trendline.direction === "up" ? "#22c55e" : "#ef4444",
          lineWidth: 2, lineStyle: 0, priceLineVisible: false, lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        trendSeries.setData([
          { time: t1, value: Number(trendline.p1.value) },
          { time: t2, value: Number(trendline.p2.value) },
        ]);
      }
    }

    // ── Candle-pattern / signal markers (arrows + labels) ──
    if (markers?.length) {
      const formatted = markers
        .map((m) => ({ ...m, time: toUnixTime(m.time) }))
        .filter((m) => m.time != null)
        .sort((a, b) => a.time - b.time);
      try {
        candleSeries.setMarkers(formatted);
      } catch {
        /* older/newer lightweight-charts marker API mismatch — ignore gracefully */
      }
    }

    chart.timeScale().fitContent();

    const resize = () => { if (ref.current) chart.applyOptions({ width: ref.current.clientWidth }); };
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      priceLines.forEach((pl) => { try { candleSeries.removePriceLine(pl); } catch { /* noop */ } });
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [resetKey, bars.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Live tick / candle-close updates — no chart rebuild, just series.update() ──
  useEffect(() => {
    if (!liveCandle || !candleSeriesRef.current) return;
    const t = typeof liveCandle.time === "number" ? liveCandle.time : toUnixTime(liveCandle.time);
    if (t == null) return;
    try {
      candleSeriesRef.current.update({
        time: t,
        open: Number(liveCandle.open),
        high: Number(liveCandle.high),
        low: Number(liveCandle.low),
        close: Number(liveCandle.close),
      });
      lastBarTimeRef.current = t;
    } catch {
      /* stale series ref during a rebuild — safe to ignore, next tick will succeed */
    }
  }, [liveCandle]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {live && (
        <div style={{
          position: "absolute", top: 10, right: 14, zIndex: 2, display: "flex", alignItems: "center", gap: 6,
          background: "rgba(7,16,24,0.85)", border: "1px solid #1e293b", borderRadius: 20, padding: "3px 10px",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", animation: "pulseLive 1.4s infinite" }} />
          <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.5 }}>LIVE</span>
        </div>
      )}
      <div ref={ref} style={{ width: "100%", height: "560px", borderRadius: 18, overflow: "hidden", background: "#071018" }} />
      <style>{`@keyframes pulseLive{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
    </div>
  );
}
// ─── Signal card ──────────────────────────────────────────────────────────────
function SigCard({ s, selected, onClick }) {
  const buy = s.direction === "BUY";
  const dc  = buy ? C.green : C.red;
  const sc  = { STRONG: C.green, MODERATE: C.gold, WEAK: "#f97316", AVOID: C.red }[s.strength] || C.muted;

  return (
    <div onClick={onClick} style={{
      background: selected ? C.surf2 : C.surf,
      border: `1px solid ${selected ? C.gold : C.border}`,
      borderLeft: `3px solid ${dc}`,
      borderRadius: 9, padding: 13, marginBottom: 8, cursor: "pointer", transition: "all .15s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 800 }}>{s.pair}</span>
          <Badge col={dc}>{s.direction}</Badge>
          <Badge col={C.muted}>{s.timeframe}</Badge>
        </div>
        <ConfRing val={s.confidence} size={50} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, fontSize: 11 }}>
        {[["ENTRY", fp(s.entry_price), C.text], ["SL", fp(s.stop_loss), C.red], ["TP", fp(s.take_profit), C.green],
          ["SL PIPS", f1(s.sl_pips), C.red], ["TP PIPS", f1(s.tp_pips), C.green], ["R:R", `1:${s.risk_reward}`, C.gold],
        ].map(([l, v, c]) => (
          <div key={l}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 0.5, marginBottom: 2 }}>{l}</div>
            <div style={{ fontWeight: 700, fontFamily: "monospace", color: c }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
        {s.status === "closed" ? (
          <Badge col={s.result === "win" ? C.green : s.result === "loss" ? C.red : C.muted}>
            {(s.result || "").toUpperCase()} {s.pnl_pips != null ? `${s.pnl_pips >= 0 ? "+" : ""}${f1(s.pnl_pips)}p` : ""}
          </Badge>
        ) : (
          <Badge col={sc}>{s.strength}</Badge>
        )}
        <Badge col={C.muted}>{s.candle_pattern || "—"}</Badge>
        <span style={{ marginLeft: "auto", fontSize: 10, color: C.muted }}>{ago(s.created_at)}</span>
      </div>
      {s.entry_time && <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{s.entry_time}</div>}
    </div>
  );
}

const PAIRS = ["EURUSD","GBPUSD","USDJPY","AUDUSD","USDCAD","USDCHF","NZDUSD","EURGBP","EURJPY","GBPJPY","XAUUSD","BTCUSD"];
const TFS   = ["M15","M30","H1","H4","D1","W1"];

export { ConfRing, CandleChart1, SigCard, PAIRS, TFS, };