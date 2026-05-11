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


export default function CandleChart1({ bars = [] }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (!bars.length) return;

    // ─────────────────────────────────────────
    // CREATE CHART
    // ─────────────────────────────────────────
    const chart = createChart(ref.current, {
      width: ref.current.clientWidth,
      height: 560,

      layout: {
        background: {
          color: "#071018",
        },

        textColor: "#94a3b8",

        fontFamily: "Inter, sans-serif",
        fontSize: 12,
      },

      grid: {
        vertLines: {
          color: "rgba(255,255,255,0.05)",
        },

        horzLines: {
          color: "rgba(255,255,255,0.05)",
        },
      },

      crosshair: {
        mode: 1,
      },

      rightPriceScale: {
        borderColor: "#1e293b",
      },

      timeScale: {
        borderColor: "#1e293b",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // ─────────────────────────────────────────
    // CANDLE SERIES
    // ─────────────────────────────────────────
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",

      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",

      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",

      priceLineVisible: true,
    });

    candleSeries.setData(
      bars.map((b) => ({
        time: b.time,
        open: Number(b.open),
        high: Number(b.high),
        low: Number(b.low),
        close: Number(b.close),
      }))
    );

    // ─────────────────────────────────────────
    // EMA 20
    // ─────────────────────────────────────────
    const ema20 = chart.addSeries(LineSeries, {
      color: "#facc15",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    ema20.setData(
      bars
        .filter((b) => b.ema20 !== undefined && b.ema20 !== null)
        .map((b) => ({
          time: b.time,
          value: Number(b.ema20),
        }))
    );

    // ─────────────────────────────────────────
    // EMA 50
    // ─────────────────────────────────────────
    const ema50 = chart.addSeries(LineSeries, {
      color: "#a855f7",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    ema50.setData(
      bars
        .filter((b) => b.ema50 !== undefined && b.ema50 !== null)
        .map((b) => ({
          time: b.time,
          value: Number(b.ema50),
        }))
    );

    // ─────────────────────────────────────────
    // BOLLINGER UPPER
    // ─────────────────────────────────────────
    if (bars.some((b) => b.bb_upper)) {
      const bbUpper = chart.addSeries(LineSeries, {
        color: "#60a5fa",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
      });

      bbUpper.setData(
        bars
          .filter((b) => b.bb_upper)
          .map((b) => ({
            time: b.time,
            value: Number(b.bb_upper),
          }))
      );
    }

    // ─────────────────────────────────────────
    // BOLLINGER LOWER
    // ─────────────────────────────────────────
    if (bars.some((b) => b.bb_lower)) {
      const bbLower = chart.addSeries(LineSeries, {
        color: "#3b82f6",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
      });

      bbLower.setData(
        bars
          .filter((b) => b.bb_lower)
          .map((b) => ({
            time: b.time,
            value: Number(b.bb_lower),
          }))
      );
    }

    // ─────────────────────────────────────────
    // FIT CONTENT
    // ─────────────────────────────────────────
    chart.timeScale().fitContent();

    // ─────────────────────────────────────────
    // RESPONSIVE RESIZE
    // ─────────────────────────────────────────
    const resize = () => {
      if (!ref.current) return;

      chart.applyOptions({
        width: ref.current.clientWidth,
      });
    };

    window.addEventListener("resize", resize);

    // ─────────────────────────────────────────
    // CLEANUP
    // ─────────────────────────────────────────
    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
  }, [bars]);

  // ─────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────
  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: "560px",
        borderRadius: 18,
        overflow: "hidden",
        background: "#071018",
      }}
    />
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
        <Badge col={sc}>{s.strength}</Badge>
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