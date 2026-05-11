/**
 * ForexPro — Complete React Frontend v4.0
 * All 28 API endpoints connected to http://localhost:8766
 *
 * Endpoints wired:
 *  POST /auth/register          POST /auth/login
 *  GET  /auth/me                PUT  /auth/profile
 *  POST /signals/generate       POST /signals/bulk
 *  GET  /signals/latest         GET  /signals/{id}
 *  GET  /signals/history        GET  /providers
 *  GET  /providers/{id}         POST /copy/subscribe
 *  DELETE /copy/unsubscribe/{id} GET /copy/my-trades
 *  GET  /copy/subscriptions     PUT  /copy/subscription/{id}
 *  GET  /prices/live            GET  /prices/chart
 *  WS   /ws/prices              GET  /education/courses
 *  GET  /education/courses/{id} POST /education/progress
 *  GET  /education/my-progress  POST /journal
 *  GET  /journal                GET  /notifications
 *  GET  /dashboard/stats        GET  /
 *
 * Setup:
 *  npm create vite@latest forexpro -- --template react
 *  cd forexpro && npm install
 *  Replace src/App.jsx with this file
 *  npm run dev
 *
 *  Backend: uvicorn forexpro_main:app --port 8766 --reload
 *  Login:   yobby@forexpro.com / demo123
 */

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Config ──────────────────────────────────────────────────────────────────
const API = "http://localhost:8766";
const WS  = "ws://localhost:8766/ws/prices";

const PAIRS = ["EURUSD","GBPUSD","USDJPY","AUDUSD","USDCAD","USDCHF","NZDUSD","EURGBP","EURJPY","GBPJPY","XAUUSD","BTCUSD"];
const TFS   = ["M15","M30","H1","H4","D1","W1"];

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  bg:      "#07090D",
  surf:    "#0D1318",
  surf2:   "#121A22",
  border:  "#1C2B38",
  text:    "#CDD8EA",
  muted:   "#48627A",
  gold:    "#F0B429",
  green:   "#00E070",
  red:     "#FF3550",
  blue:    "#3D9EFF",
  purple:  "#9B7FFF",
};

// ─── API client ───────────────────────────────────────────────────────────────
function useApi(token) {
  const req = useCallback(async (method, path, body) => {
    const res = await fetch(API + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
    return data;
  }, [token]);

  return {
    get:  (p)    => req("GET",    p),
    post: (p, b) => req("POST",   p, b),
    put:  (p, b) => req("PUT",    p, b),
    del:  (p)    => req("DELETE", p),
  };
}

// ─── Format helpers ───────────────────────────────────────────────────────────
const fp  = (v, d = 5) => v != null ? Number(v).toFixed(d) : "—";
const f2  = (v) => v != null ? Number(v).toFixed(2) : "—";
const f1  = (v) => v != null ? Number(v).toFixed(1) : "—";
const fpc = (v) => v != null ? (v >= 0 ? "+" : "") + Number(v).toFixed(2) + "%" : "—";
const usd = (v) => v != null ? (Number(v) >= 0 ? "+$" : "-$") + Math.abs(Number(v)).toFixed(2) : "—";
const ago = (s) => {
  if (!s) return "";
  const d = Math.floor((Date.now() - new Date(s)) / 1000);
  if (d < 60)   return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  return `${Math.floor(d / 3600)}h ago`;
};

// ─── Shared UI components ─────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{ background: C.surf, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 14, ...style }}>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 13 }}>
    {children}
  </div>
);

const Stat = ({ label, value, sub, color }) => (
  <div style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 13 }}>
    <div style={{ fontSize: 10, color: C.muted, letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || C.text }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Badge = ({ col, children }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", fontSize: 10, padding: "2px 8px",
    borderRadius: 99, border: `1px solid ${col}`, color: col, background: col + "18",
    fontWeight: 700, letterSpacing: 0.5, flexShrink: 0,
  }}>{children}</span>
);

const Btn = ({ onClick, disabled, children, col = C.gold, ghost = false, full = false, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: "8px 16px", borderRadius: 7, fontSize: 12, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    border: `1px solid ${col}`, fontFamily: "inherit", transition: "all .15s",
    background: ghost ? "transparent" : col,
    color: ghost ? col : col === C.gold ? C.bg : "#fff",
    opacity: disabled ? 0.5 : 1,
    width: full ? "100%" : undefined,
    ...style,
  }}>{children}</button>
);

const Inp = ({ value, onChange, type = "text", placeholder, min, max, step, rows, style = {} }) =>
  rows
    ? <textarea value={value} onChange={onChange} rows={rows} placeholder={placeholder}
        style={{ width: "100%", padding: "8px 10px", background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12, fontFamily: "inherit", resize: "vertical", ...style }} />
    : <input value={value} onChange={onChange} type={type} placeholder={placeholder} min={min} max={max} step={step}
        style={{ width: "100%", padding: "8px 10px", background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12, fontFamily: "inherit", ...style }} />;

const Sel = ({ value, onChange, options }) => (
  <select value={value} onChange={onChange}
    style={{ width: "100%", padding: "8px 10px", background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12, fontFamily: "inherit" }}>
    {options.map(o => typeof o === "string"
      ? <option key={o} value={o}>{o}</option>
      : <option key={o.v} value={o.v}>{o.l}</option>)}
  </select>
);

const Pill = ({ on, onClick, children }) => (
  <button onClick={onClick} style={{
    padding: "3px 9px", borderRadius: 99, fontSize: 10, fontWeight: 700, cursor: "pointer",
    border: `1px solid ${on ? C.gold : C.border}`,
    background: on ? C.gold + "18" : "transparent",
    color: on ? C.gold : C.muted, fontFamily: "inherit", transition: "all .15s",
  }}>{children}</button>
);

const FG = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.5, display: "block", marginBottom: 5, textTransform: "uppercase" }}>{label}</label>}
    {children}
  </div>
);

const InfoBox = ({ col = C.blue, children }) => (
  <div style={{ background: col + "12", border: `1px solid ${col}30`, borderLeft: `3px solid ${col}`, borderRadius: "0 8px 8px 0", padding: "11px 14px", marginBottom: 13 }}>
    {children}
  </div>
);

const ErrBox = ({ msg }) => msg
  ? <div style={{ background: C.red + "18", border: `1px solid ${C.red}`, borderRadius: 7, padding: "8px 12px", color: C.red, fontSize: 11, marginBottom: 10 }}>{msg}</div>
  : null;

const OkBox = ({ msg }) => msg
  ? <div style={{ background: C.green + "18", border: `1px solid ${C.green}`, borderRadius: 7, padding: "8px 12px", color: C.green, fontSize: 11, marginBottom: 10 }}>{msg}</div>
  : null;

const Grid = ({ cols = "1fr 1fr", gap = 14, children, style = {} }) => (
  <div style={{ display: "grid", gridTemplateColumns: cols, gap, ...style }}>{children}</div>
);

const ChartWrap = ({ label, children }) => (
  <div style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 11, marginBottom: 12 }}>
    <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 7 }}>{label}</div>
    {children}
  </div>
);

const Modal = ({ onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99 }} onClick={onClose}>
    <div style={{ background: C.surf, border: `1px solid ${C.border}`, borderRadius: 13, padding: 26, width: 460, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

const ProgressBar = ({ pct, col = C.gold }) => (
  <div style={{ height: 4, background: C.surf2, borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
    <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: col, borderRadius: 2, transition: "width .4s" }} />
  </div>
);

const Row = ({ children, style = {} }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${C.border}20`, ...style }}>
    {children}
  </div>
);

// ─── Confidence ring ──────────────────────────────────────────────────────────
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

// ─── Auth page ────────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [tab,  setTab]  = useState("login");
  const [form, setForm] = useState({ email: "yobby@forexpro.com", password: "demo123", username: "" });
  const [err,  setErr]  = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const res = await fetch(`${API}${tab === "login" ? "/auth/login" : "/auth/register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error");
      onLogin(data.token, data.user);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surf, border: `1px solid ${C.border}`, borderRadius: 14, padding: 32, width: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>Forex<span style={{ color: C.gold }}>Pro</span></div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Professional Trading Platform</div>
        </div>

        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
          {["login", "register"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "8px 0", background: "transparent", border: "none",
              borderBottom: `2px solid ${tab === t ? C.gold : "transparent"}`,
              color: tab === t ? C.gold : C.muted, fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}>{t === "login" ? "Sign In" : "Register"}</button>
          ))}
        </div>

        <FG label="Email"><Inp type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></FG>
        {tab === "register" && <FG label="Username"><Inp value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} /></FG>}
        <FG label="Password"><Inp type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></FG>

        <ErrBox msg={err} />
        <Btn col={C.gold} full onClick={submit} disabled={busy}>{busy ? "Please wait…" : tab === "login" ? "Sign In" : "Create Account"}</Btn>
        <div style={{ textAlign: "center", fontSize: 11, color: C.muted, marginTop: 12 }}>Demo: yobby@forexpro.com / demo123</div>
      </div>
    </div>
  );
}

// ─── Ticker bar ───────────────────────────────────────────────────────────────
function Ticker({ api }) {
  const [prices, setPrices] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    const connect = () => {
      const sock = new WebSocket(WS);
      sock.onmessage = e => { try { const d = JSON.parse(e.data); if (d.data) setPrices(d.data); } catch {} };
      sock.onerror   = () => sock.close();
      ws.current     = sock;
    };
    connect();
    const poll = () => api.get("/prices/live?pairs=EURUSD,GBPUSD,USDJPY,AUDUSD,USDCAD,XAUUSD,BTCUSD,GBPJPY")
      .then(d => { if (!ws.current || ws.current.readyState !== 1) setPrices(d.prices || []); }).catch(() => {});
    poll();
    const t = setInterval(poll, 12000);
    return () => { clearInterval(t); ws.current?.close(); };
  }, []);

  if (!prices.length) return <div style={{ height: 28, background: C.surf2, borderBottom: `1px solid ${C.border}` }} />;

  const items = prices.map(p => (
    <span key={p.pair} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
      <span style={{ color: C.muted, fontSize: 11 }}>{p.pair}</span>
      <span style={{ fontFamily: "monospace", fontSize: 11, color: p.direction === "up" ? C.green : C.red }}>
        {p.pair === "BTCUSD" ? f2(p.price) : fp(p.price)} {fpc(p.change_pct)}
      </span>
    </span>
  ));

  return (
    <div style={{ overflow: "hidden", background: C.surf2, borderBottom: `1px solid ${C.border}`, height: 28, display: "flex", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 36, whiteSpace: "nowrap", padding: "0 16px", animation: "ticker 40s linear infinite" }}>
        {[...items, ...items]}
      </div>
      <style>{`@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ api }) {
  const [stats,   setStats]   = useState(null);
  const [prices,  setPrices]  = useState([]);
  const [signals, setSignals] = useState([]);
  const [copies,  setCopies]  = useState([]);
  const [notifs,  setNotifs]  = useState([]);

  useEffect(() => {
    api.get("/dashboard/stats").then(setStats).catch(() => {});
    api.get("/prices/live?pairs=EURUSD,GBPUSD,USDJPY,XAUUSD,BTCUSD,GBPJPY").then(d => setPrices(d.prices || [])).catch(() => {});
    api.get("/signals/latest?limit=8").then(d => setSignals(d.signals || [])).catch(() => {});
    api.get("/copy/my-trades").then(d => setCopies((d.trades || []).slice(0, 6))).catch(() => {});
    api.get("/notifications").then(d => setNotifs((d.notifications || []).slice(0, 6))).catch(() => {});
    const t = setInterval(() => {
      api.get("/dashboard/stats").then(setStats).catch(() => {});
      api.get("/prices/live?pairs=EURUSD,GBPUSD,USDJPY,XAUUSD,BTCUSD,GBPJPY").then(d => setPrices(d.prices || [])).catch(() => {});
    }, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      {stats && (
        <Grid cols="repeat(4,minmax(0,1fr))" gap={12} style={{ marginBottom: 18 }}>
          <Stat label="Balance"      value={`$${Number(stats.balance || 0).toLocaleString()}`}   color={C.blue}   sub={`Equity $${Number(stats.equity || 0).toLocaleString()}`} />
          <Stat label="Copy P&L"     value={usd(stats.total_pnl_usd)}                            color={(stats.total_pnl_usd || 0) >= 0 ? C.green : C.red} sub={`${stats.copy_trades || 0} trades`} />
          <Stat label="Copying"      value={stats.active_subscriptions || 0}                      color={C.purple} sub="active providers" />
          <Stat label="Courses Done" value={stats.courses_completed || 0}                         color={C.gold}   sub="education" />
        </Grid>
      )}

      <Grid cols="1fr 1fr" gap={16}>
        <div>
          <Card>
            <SectionTitle>Latest Signals</SectionTitle>
            {signals.length === 0
              ? <div style={{ color: C.muted, fontSize: 12, padding: "12px 0" }}>Go to Signals → Generate to see signals here</div>
              : signals.map(s => (
                  <Row key={s.id}>
                    <strong style={{ flex: 1, fontSize: 12 }}>{s.pair}</strong>
                    <Badge col={s.direction === "BUY" ? C.green : C.red}>{s.direction}</Badge>
                    <Badge col={C.muted}>{s.timeframe}</Badge>
                    <span style={{ fontFamily: "monospace", fontSize: 11 }}>{fp(s.entry_price)}</span>
                    <span style={{ color: C.gold, fontSize: 11 }}>{s.confidence}%</span>
                  </Row>
                ))}
          </Card>

          <Card>
            <SectionTitle>Notifications</SectionTitle>
            {notifs.length === 0
              ? <div style={{ color: C.muted, fontSize: 12 }}>No notifications yet</div>
              : notifs.map(n => (
                  <Row key={n.id} style={{ opacity: n.is_read ? 0.5 : 1 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{(n.message || "").slice(0, 65)}</div>
                    </div>
                    <span style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>{ago(n.created_at)}</span>
                  </Row>
                ))}
          </Card>
        </div>

        <div>
          <Card>
            <SectionTitle>Live Prices</SectionTitle>
            {prices.map(p => (
              <Row key={p.pair} style={{ justifyContent: "space-between" }}>
                <strong style={{ fontSize: 12 }}>{p.pair}</strong>
                <span style={{ fontFamily: "monospace", fontSize: 12 }}>{p.pair === "BTCUSD" ? f2(p.price) : fp(p.price)}</span>
                <span style={{ color: p.direction === "up" ? C.green : C.red, fontSize: 11, minWidth: 64, textAlign: "right" }}>{fpc(p.change_pct)}</span>
              </Row>
            ))}
          </Card>

          <Card>
            <SectionTitle>Active Copy Trades</SectionTitle>
            {copies.length === 0
              ? <div style={{ color: C.muted, fontSize: 12 }}>No copy trades — subscribe to a provider first</div>
              : copies.map(t => (
                  <Row key={t.id}>
                    <strong style={{ fontSize: 12, flex: 1 }}>{t.pair}</strong>
                    <Badge col={t.direction === "BUY" ? C.green : C.red}>{t.direction}</Badge>
                    <span style={{ fontFamily: "monospace", fontSize: 11 }}>{fp(t.entry_price)}</span>
                    <span style={{ fontWeight: 700, fontSize: 12, color: Number(t.pnl_usd) >= 0 ? C.green : C.red }}>{usd(t.pnl_usd)}</span>
                  </Row>
                ))}
          </Card>
        </div>
      </Grid>
    </div>
  );
}

// ─── Signals ──────────────────────────────────────────────────────────────────
function Signals({ api }) {
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
          <CandleChart bars={bars} entry={s.entry_price} sl={s.stop_loss} tp={s.take_profit} />
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

// ─── Copy Trading ─────────────────────────────────────────────────────────────
function CopyTrading({ api }) {
  const [trades,  setTrades]  = useState([]);
  const [stats,   setStats]   = useState({});
  const [subs,    setSubs]    = useState([]);
  const [editSub, setEditSub] = useState(null);
  const [ef,      setEf]      = useState({});
  const [busy,    setBusy]    = useState(false);

  const load = useCallback(() => {
    api.get("/copy/my-trades").then(d => { setTrades(d.trades || []); setStats(d.stats || {}); }).catch(() => {});
    api.get("/copy/subscriptions").then(d => setSubs(d.subscriptions || [])).catch(() => {});
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const openEdit = sub => { setEditSub(sub); setEf({ risk_pct: sub.risk_pct, max_lot: sub.max_lot, min_confidence: sub.min_confidence, auto_copy: sub.auto_copy }); };

  const saveEdit = async () => {
    setBusy(true);
    try { await api.put(`/copy/subscription/${editSub.provider_id}`, { ...ef, provider_id: editSub.provider_id, pairs_filter: [] }); setEditSub(null); load(); }
    catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const unsub = async pid => {
    if (!confirm("Unsubscribe from this provider?")) return;
    try { await api.del(`/copy/unsubscribe/${pid}`); load(); } catch (e) { alert(e.message); }
  };

  const statusColor = { open: C.green, pending: C.gold, closed: C.muted, failed: C.red };

  return (
    <div style={{ padding: 20 }}>
      <Grid cols="repeat(4,minmax(0,1fr))" gap={12} style={{ marginBottom: 18 }}>
        <Stat label="Total Trades" value={stats.total  || 0}                        color={C.blue} />
        <Stat label="Wins"         value={stats.wins   || 0}                         color={C.green} />
        <Stat label="Losses"       value={stats.losses || 0}                         color={C.red} />
        <Stat label="Total P&L"    value={usd(stats.total_pnl_usd)}                  color={(stats.total_pnl_usd || 0) >= 0 ? C.green : C.red} />
      </Grid>

      {/* Active subscriptions */}
      {subs.length > 0 && (
        <Card>
          <SectionTitle>Active Subscriptions</SectionTitle>
          {subs.map(sub => (
            <Row key={sub.provider_id} style={{ flexWrap: "wrap", gap: 10 }}>
              <strong style={{ flex: 1, fontSize: 13 }}>{sub.display_name}</strong>
              <span style={{ fontSize: 11, color: C.muted }}>WR {sub.win_rate}%</span>
              <span style={{ fontSize: 11, color: C.muted }}>Risk {sub.risk_pct}%</span>
              <Badge col={sub.auto_copy ? C.green : C.gold}>{sub.auto_copy ? "AUTO" : "MANUAL"}</Badge>
              <Btn col={C.gold}  ghost onClick={() => openEdit(sub)}  style={{ padding: "4px 10px", fontSize: 10 }}>Edit</Btn>
              <Btn col={C.red}   ghost onClick={() => unsub(sub.provider_id)} style={{ padding: "4px 10px", fontSize: 10 }}>Unsubscribe</Btn>
            </Row>
          ))}
        </Card>
      )}

      {/* Trade history table */}
      <Card>
        <SectionTitle>Copy Trade History ({trades.length})</SectionTitle>
        {trades.length === 0
          ? <div style={{ color: C.muted, fontSize: 12, padding: "12px 0" }}>No copy trades yet — subscribe to a provider in the Providers tab</div>
          : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "75px 55px 115px 95px 95px 85px 85px 85px 85px", gap: 8, padding: "5px 0", borderBottom: `1px solid ${C.border}`, fontSize: 9, color: C.muted, letterSpacing: 1, fontWeight: 700 }}>
                {["PAIR","DIR","PROVIDER","ENTRY","SL","TP","P&L $","PIPS","STATUS"].map(h => <span key={h}>{h}</span>)}
              </div>
              {trades.map(t => (
                <div key={t.id} style={{ display: "grid", gridTemplateColumns: "75px 55px 115px 95px 95px 85px 85px 85px 85px", gap: 8, padding: "9px 0", borderBottom: `1px solid ${C.border}20`, alignItems: "center", fontSize: 12 }}>
                  <strong>{t.pair}</strong>
                  <Badge col={t.direction === "BUY" ? C.green : C.red}>{t.direction}</Badge>
                  <span style={{ fontSize: 11, color: C.muted }}>{t.provider_name || "—"}</span>
                  <span style={{ fontFamily: "monospace", fontSize: 11 }}>{fp(t.entry_price)}</span>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: C.red }}>{fp(t.stop_loss)}</span>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: C.green }}>{fp(t.take_profit)}</span>
                  <span style={{ fontWeight: 700, color: Number(t.pnl_usd) >= 0 ? C.green : C.red }}>{usd(t.pnl_usd)}</span>
                  <span style={{ color: Number(t.pnl_pips) >= 0 ? C.green : C.red }}>{f1(t.pnl_pips)}p</span>
                  <Badge col={statusColor[t.status] || C.muted}>{(t.status || "").toUpperCase()}</Badge>
                </div>
              ))}
            </>
          )}
      </Card>

      {/* Edit modal */}
      {editSub && (
        <Modal onClose={() => setEditSub(null)}>
          <SectionTitle>Edit Settings — {editSub.display_name}</SectionTitle>
          <FG label="Risk per trade (%)"><Inp type="number" min=".5" max="10" step=".5" value={ef.risk_pct} onChange={e => setEf(p => ({ ...p, risk_pct: +e.target.value }))} /></FG>
          <FG label="Max lot size"><Inp type="number" min=".01" max="1" step=".01" value={ef.max_lot} onChange={e => setEf(p => ({ ...p, max_lot: +e.target.value }))} /></FG>
          <FG label="Min confidence (%)"><Inp type="number" min="50" max="95" value={ef.min_confidence} onChange={e => setEf(p => ({ ...p, min_confidence: +e.target.value }))} /></FG>
          <FG label="Auto copy"><Sel value={ef.auto_copy ? "1" : "0"} onChange={e => setEf(p => ({ ...p, auto_copy: e.target.value === "1" }))} options={[{ v: "1", l: "Yes — Automatic" }, { v: "0", l: "No — Manual" }]} /></FG>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn col={C.gold} onClick={saveEdit} disabled={busy}>{busy ? "Saving…" : "Save Changes"}</Btn>
            <Btn col={C.muted} ghost onClick={() => setEditSub(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Providers ────────────────────────────────────────────────────────────────
function Providers({ api }) {
  const [list,    setList]    = useState([]);
  const [detail,  setDetail]  = useState(null);
  const [subForm, setSubForm] = useState(null);
  const [myIds,   setMyIds]   = useState([]);
  const [sf,      setSf]      = useState({ risk_pct: 2, max_lot: 0.05, min_confidence: 65, auto_copy: true });
  const [busy,    setBusy]    = useState(false);
  const [ok,      setOk]      = useState("");

  useEffect(() => {
    api.get("/providers").then(d => setList(d.providers || [])).catch(() => {});
    api.get("/copy/subscriptions").then(d => setMyIds((d.subscriptions || []).map(s => s.provider_id))).catch(() => {});
  }, []);

  const openDetail = async p => {
    try { setDetail(await api.get(`/providers/${p.id}`)); }
    catch {}
  };

  const subscribe = async () => {
    setBusy(true);
    try {
      await api.post("/copy/subscribe", { provider_id: subForm.user_id, ...sf, pairs_filter: [] });
      setMyIds(p => [...p, subForm.user_id]);
      setSubForm(null);
      setOk("✅ Subscribed! Auto-copy is now active.");
      setTimeout(() => setOk(""), 3000);
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const unsub = async uid => {
    try { await api.del(`/copy/unsubscribe/${uid}`); setMyIds(p => p.filter(x => x !== uid)); }
    catch (e) { alert(e.message); }
  };

  return (
    <div style={{ padding: 20 }}>
      <OkBox msg={ok} />
      <div style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>Discover top signal providers and copy their trades automatically</div>

      <Grid cols="1fr 1fr" gap={16}>
        {/* Provider cards */}
        <div>
          {list.map(p => {
            const following = myIds.includes(p.user_id);
            return (
              <div key={p.id} onClick={() => openDetail(p)} style={{
                background: C.surf, border: `1px solid ${following ? C.gold : C.border}`,
                borderRadius: 10, padding: 16, marginBottom: 10, cursor: "pointer", transition: "border-color .15s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg,${C.blue},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                    {(p.display_name || "??")[0]}{(p.display_name || "??")[1]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      {p.display_name}
                      {p.is_verified && <span style={{ color: C.blue, fontSize: 11 }}>✓</span>}
                      {following && <Badge col={C.gold}>FOLLOWING</Badge>}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>{p.username}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>{(p.description || "").slice(0, 80)}…</div>
                <Grid cols="repeat(3,1fr)" gap={8} style={{ textAlign: "center", borderTop: `1px solid ${C.border}`, paddingTop: 12, marginBottom: 12 }}>
                  {[[`${p.win_rate}%`, "Win Rate", C.green], [`+${p.total_pips}`, "Total Pips", C.blue], [p.followers_count, "Followers", C.purple]].map(([v, l, c]) => (
                    <div key={l}><div style={{ fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 9, color: C.muted }}>{l}</div></div>
                  ))}
                </Grid>
                {following
                  ? <Btn col={C.red} ghost full onClick={e => { e.stopPropagation(); unsub(p.user_id); }}>✗ Unsubscribe</Btn>
                  : <Btn col={C.gold} full onClick={e => { e.stopPropagation(); setSubForm(p); }}>{p.monthly_fee > 0 ? `Subscribe $${p.monthly_fee}/mo` : "Subscribe Free"}</Btn>}
              </div>
            );
          })}
        </div>

        {/* Provider detail */}
        {detail && (
          <Card>
            <SectionTitle>{detail.display_name} — Performance</SectionTitle>
            <Grid cols="repeat(4,minmax(0,1fr))" gap={10} style={{ marginBottom: 14 }}>
              <Stat label="Win Rate"    value={`${detail.win_rate}%`}    color={C.green} />
              <Stat label="Total Pips"  value={`+${detail.total_pips}`}  color={C.blue} />
              <Stat label="Monthly"     value={`+${detail.monthly_pips}`} color={C.gold} />
              <Stat label="Avg R:R"     value={`1:${detail.avg_rr}`}     color={C.purple} />
            </Grid>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, marginBottom: 14 }}>{detail.description}</div>
            <SectionTitle>Recent Signals ({detail.recent_signals?.length || 0})</SectionTitle>
            {(detail.recent_signals || []).slice(0, 8).map(s => (
              <Row key={s.id} style={{ fontSize: 12 }}>
                <strong style={{ flex: 1 }}>{s.pair}</strong>
                <Badge col={s.direction === "BUY" ? C.green : C.red}>{s.direction}</Badge>
                <Badge col={C.muted}>{s.timeframe}</Badge>
                <span style={{ fontFamily: "monospace" }}>{fp(s.entry_price)}</span>
                <span style={{ color: C.gold }}>{s.confidence}%</span>
                <Badge col={{ STRONG: C.green, MODERATE: C.gold, WEAK: "#f97316" }[s.strength] || C.muted}>{s.strength}</Badge>
              </Row>
            ))}
          </Card>
        )}
      </Grid>

      {/* Subscribe modal */}
      {subForm && (
        <Modal onClose={() => setSubForm(null)}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Subscribe to {subForm.display_name}</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>Configure how you want to copy this provider's trades</div>
          <FG label="Risk per trade (%)"><Inp type="number" min=".5" max="10" step=".5" value={sf.risk_pct} onChange={e => setSf(p => ({ ...p, risk_pct: +e.target.value }))} /></FG>
          <FG label="Max lot size"><Inp type="number" min=".01" max="1" step=".01" value={sf.max_lot} onChange={e => setSf(p => ({ ...p, max_lot: +e.target.value }))} /></FG>
          <FG label="Min confidence (%)"><Inp type="number" min="50" max="95" value={sf.min_confidence} onChange={e => setSf(p => ({ ...p, min_confidence: +e.target.value }))} /></FG>
          <FG label="Auto copy"><Sel value={sf.auto_copy ? "1" : "0"} onChange={e => setSf(p => ({ ...p, auto_copy: e.target.value === "1" }))} options={[{ v: "1", l: "Yes — Automatic (recommended)" }, { v: "0", l: "No — Manual approve" }]} /></FG>
          <InfoBox col={C.gold}><div style={{ fontSize: 11, lineHeight: 1.75 }}><strong>Tip for $10–$50 accounts:</strong> Set risk to 1–2% and max lot to 0.01–0.05 on FBS Cent. This limits loss per trade to $0.10–$1.00.</div></InfoBox>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn col={C.gold} onClick={subscribe} disabled={busy}>{busy ? "Subscribing…" : "✓ Subscribe & Copy"}</Btn>
            <Btn col={C.muted} ghost onClick={() => setSubForm(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Education ────────────────────────────────────────────────────────────────
function Education({ api }) {
  const [courses,  setCourses]  = useState([]);
  const [myProg,   setMyProg]   = useState([]);
  const [active,   setActive]   = useState(null); // { course, lessons, lessonIdx }
  const [quiz,     setQuiz]     = useState(null);  // { answered, chosen, correct }

  const loadAll = useCallback(() => {
    api.get("/education/courses").then(d => setCourses(d.courses || [])).catch(() => {});
    api.get("/education/my-progress").then(d => setMyProg(d.progress || [])).catch(() => {});
  }, [api]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const openCourse = async c => {
    try {
      const d = await api.get(`/education/courses/${c.id}`);
      const idx = d.progress?.lesson_idx || 0;
      setActive({ course: d, lessons: d.lessons || [], idx });
      setQuiz(null);
    } catch (e) { alert(e.message); }
  };

  const saveProgress = (courseId, idx, completed = false) => {
    api.post("/education/progress", { course_id: courseId, lesson_idx: idx, completed, score: completed ? 80 : 0 }).catch(() => {});
  };

  const next = () => {
    const { course, lessons, idx } = active;
    if (lessons[idx]?.quiz && !quiz?.answered) { alert("Please answer the quiz first!"); return; }
    if (idx < lessons.length - 1) {
      const nxt = idx + 1;
      setActive(p => ({ ...p, idx: nxt }));
      setQuiz(null);
      saveProgress(course.id, nxt);
    } else {
      saveProgress(course.id, lessons.length, true);
      alert(`🎉 Course complete! "${course.title}"`);
      setActive(null);
      loadAll();
    }
  };

  const progMap = Object.fromEntries(myProg.map(p => [p.course_id, p]));
  const ICONS   = { basics: "📊", technical: "📈", risk: "🛡️", psychology: "🧠", advanced: "⚡" };
  const LVCOL   = { beginner: C.green, intermediate: C.blue, advanced: C.gold };

  // Lesson view
  if (active) {
    const { course, lessons, idx } = active;
    const lesson = lessons[idx];
    const pct    = Math.floor((idx / lessons.length) * 100);
    return (
      <div style={{ padding: 20 }}>
        <Btn col={C.muted} ghost onClick={() => setActive(null)} style={{ marginBottom: 14 }}>← Back to Courses</Btn>
        <div style={{ maxWidth: 760 }}>
          <div style={{ fontSize: 10, color: LVCOL[course.level] || C.muted, letterSpacing: 2, marginBottom: 5 }}>
            {course.title.toUpperCase()} — LESSON {idx + 1}/{lessons.length}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>{lesson.title}</div>
          <ProgressBar pct={pct} />
          <div style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 9, padding: 20, fontSize: 14, lineHeight: 1.9, color: C.text, opacity: 0.88, marginBottom: 16 }}>
            {lesson.content}
          </div>

          {lesson.quiz && (
            <div style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 9, padding: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>📝 Quick Quiz</div>
              <div style={{ fontSize: 14, marginBottom: 12 }}>{lesson.quiz.q}</div>
              {lesson.quiz.options.map((opt, i) => {
                const state = !quiz?.answered ? "idle" : i === quiz.correct ? "correct" : i === quiz.chosen && i !== quiz.correct ? "wrong" : "idle";
                const col   = state === "correct" ? C.green : state === "wrong" ? C.red : C.border;
                const bg    = state === "correct" ? C.green + "18" : state === "wrong" ? C.red + "18" : C.surf;
                return (
                  <div key={i} onClick={() => !quiz?.answered && setQuiz({ answered: true, chosen: i, correct: lesson.quiz.answer })}
                    style={{ background: bg, border: `1px solid ${col}`, color: state !== "idle" ? col : C.text, borderRadius: 8, padding: "9px 13px", cursor: "pointer", marginBottom: 7, fontSize: 13, transition: "all .2s" }}>
                    {String.fromCharCode(65 + i)}. {opt}
                  </div>
                );
              })}
              {quiz?.answered && (
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: quiz.chosen === quiz.correct ? C.green : C.red }}>
                  {quiz.chosen === quiz.correct ? "✓ Correct!" : "✗ Wrong — re-read the lesson above"}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            {idx > 0 && <Btn col={C.muted} ghost onClick={() => { setActive(p => ({ ...p, idx: idx - 1 })); setQuiz(null); }}>← Previous</Btn>}
            <Btn col={C.gold} onClick={next} style={{ marginLeft: "auto" }}>{idx < lessons.length - 1 ? "Next Lesson →" : "Complete Course ✓"}</Btn>
          </div>
        </div>
      </div>
    );
  }

  const done   = myProg.filter(p => p.completed).length;
  const inProg = myProg.filter(p => p.lesson_idx > 0 && !p.completed).length;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 3 }}>Learning Hub</div>
          <div style={{ fontSize: 12, color: C.muted }}>Master forex from fundamentals to advanced copy trading systems</div>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[["Completed", done, C.green], ["In Progress", inProg, C.gold], ["Total", courses.length, C.text]].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: c }}>{v}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 16 }}>
        {courses.map(c => {
          const prog = progMap[c.id] || { lesson_idx: 0, completed: 0 };
          const pct  = prog.completed ? 100 : Math.floor((prog.lesson_idx / (c.lesson_count || 1)) * 100);
          return (
            <div key={c.id} onClick={() => openCourse(c)} style={{
              background: C.surf, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, cursor: "pointer",
            }}
              onMouseOver={e => e.currentTarget.style.borderColor = C.muted}
              onMouseOut={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>{ICONS[c.category] || "📚"}</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 12, lineHeight: 1.55 }}>{c.description}</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 11, flexWrap: "wrap" }}>
                <Badge col={LVCOL[c.level] || C.muted}>{c.level}</Badge>
                <Badge col={C.muted}>{c.lesson_count} lessons</Badge>
                {prog.completed ? <Badge col={C.green}>✓ Done</Badge> : null}
              </div>
              <ProgressBar pct={pct} />
              <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{pct}% complete</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Journal ──────────────────────────────────────────────────────────────────
function Journal({ api }) {
  const [trades, setTrades] = useState([]);
  const [stats,  setStats]  = useState({});
  const [form,   setForm]   = useState({ pair: "EURUSD", direction: "BUY", entry_price: "", exit_price: "", lot_size: 0.01, pnl_usd: "", pnl_pips: "", notes: "", emotion: "calm", setup: "" });
  const [busy,   setBusy]   = useState(false);
  const [ok,     setOk]     = useState("");

  const load = useCallback(() => {
    api.get("/journal").then(d => { setTrades(d.trades || []); setStats(d.stats || {}); }).catch(() => {});
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.entry_price || !form.exit_price) { alert("Fill in entry and exit price"); return; }
    setBusy(true);
    try {
      await api.post("/journal", { ...form, entry_price: +form.entry_price, exit_price: +form.exit_price, lot_size: +form.lot_size, pnl_usd: +form.pnl_usd, pnl_pips: +form.pnl_pips });
      setOk("Trade logged!"); setTimeout(() => setOk(""), 2500);
      setForm(p => ({ ...p, entry_price: "", exit_price: "", pnl_usd: "", pnl_pips: "", notes: "", setup: "" }));
      load();
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const F = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ padding: 20 }}>
      <Grid cols="repeat(4,minmax(0,1fr))" gap={12} style={{ marginBottom: 18 }}>
        <Stat label="Total Trades" value={stats.total     || 0}                     color={C.blue} />
        <Stat label="Win Rate"     value={`${stats.win_rate || 0}%`}                color={(stats.win_rate || 0) >= 50 ? C.green : C.red} />
        <Stat label="Total P&L"    value={usd(stats.total_pnl)}                     color={(stats.total_pnl || 0) >= 0 ? C.green : C.red} />
        <Stat label="Best Trade"   value={usd(stats.best_trade)}                    color={C.green} />
      </Grid>

      <Grid cols="1fr 310px" gap={16}>
        {/* History */}
        <Card>
          <SectionTitle>Trade History ({trades.length})</SectionTitle>
          {trades.length === 0
            ? <div style={{ color: C.muted, fontSize: 12 }}>No journal entries yet — log your first trade →</div>
            : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "75px 50px 95px 95px 75px 75px 1fr", gap: 8, padding: "5px 0", borderBottom: `1px solid ${C.border}`, fontSize: 9, color: C.muted, letterSpacing: 1, fontWeight: 700 }}>
                  {["PAIR","DIR","ENTRY","EXIT","P&L","PIPS","SETUP"].map(h => <span key={h}>{h}</span>)}
                </div>
                {trades.map(t => (
                  <div key={t.id} style={{ display: "grid", gridTemplateColumns: "75px 50px 95px 95px 75px 75px 1fr", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.border}20`, alignItems: "center", fontSize: 12 }}>
                    <strong>{t.pair}</strong>
                    <Badge col={t.direction === "BUY" ? C.green : C.red}>{t.direction}</Badge>
                    <span style={{ fontFamily: "monospace", fontSize: 11 }}>{fp(t.entry_price)}</span>
                    <span style={{ fontFamily: "monospace", fontSize: 11 }}>{fp(t.exit_price)}</span>
                    <span style={{ fontWeight: 700, color: Number(t.pnl_usd) >= 0 ? C.green : C.red }}>{usd(t.pnl_usd)}</span>
                    <span style={{ color: Number(t.pnl_pips) >= 0 ? C.green : C.red }}>{f1(t.pnl_pips)}p</span>
                    <span style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.setup || t.notes}</span>
                  </div>
                ))}
              </>
            )}
        </Card>

        {/* Log form */}
        <Card>
          <SectionTitle>Log a Trade</SectionTitle>
          <OkBox msg={ok} />
          <FG label="Pair"><Sel value={form.pair} onChange={F("pair")} options={PAIRS} /></FG>
          <FG label="Direction"><Sel value={form.direction} onChange={F("direction")} options={["BUY","SELL"]} /></FG>
          <Grid cols="1fr 1fr" gap={8}>
            <FG label="Entry Price"><Inp type="number" step=".00001" value={form.entry_price} onChange={F("entry_price")} placeholder="1.08500" /></FG>
            <FG label="Exit Price"><Inp type="number" step=".00001" value={form.exit_price} onChange={F("exit_price")} placeholder="1.09000" /></FG>
            <FG label="Lot Size"><Inp type="number" step=".01" value={form.lot_size} onChange={F("lot_size")} /></FG>
            <FG label="P&L ($)"><Inp type="number" step=".01" value={form.pnl_usd} onChange={F("pnl_usd")} placeholder="5.00" /></FG>
          </Grid>
          <FG label="Pips"><Inp type="number" step=".1" value={form.pnl_pips} onChange={F("pnl_pips")} /></FG>
          <FG label="Emotion"><Sel value={form.emotion} onChange={F("emotion")} options={["calm","confident","fearful","greedy","frustrated"]} /></FG>
          <FG label="Setup / Notes"><Inp rows={2} value={form.notes} onChange={F("notes")} placeholder="What triggered this trade? What did you learn?" /></FG>
          <Btn col={C.gold} full onClick={submit} disabled={busy}>{busy ? "Saving…" : "Log Trade"}</Btn>
        </Card>
      </Grid>
    </div>
  );
}

// ─── Live Prices page ─────────────────────────────────────────────────────────
function PricesPage({ api }) {
  const [prices, setPrices] = useState([]);
  const [selP,   setSelP]   = useState("EURUSD");
  const [selTf,  setSelTf]  = useState("H1");
  const [bars,   setBars]   = useState([]);
  const [busy,   setBusy]   = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    const sock = new WebSocket(WS);
    sock.onmessage = e => { try { const d = JSON.parse(e.data); if (d.data) setPrices(d.data); } catch {} };
    ws.current = sock;
    const poll = () => api.get("/prices/live").then(d => { if (!ws.current || ws.current.readyState !== 1) setPrices(d.prices || []); }).catch(() => {});
    poll();
    const t = setInterval(poll, 8000);
    return () => { clearInterval(t); sock.close(); };
  }, []);

  const loadChart = async () => {
    setBusy(true);
    try { const d = await api.get(`/prices/chart?pair=${selP}&timeframe=${selTf}&candles=100`); setBars(d.candles || []); }
    catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(165px,1fr))", gap: 10, marginBottom: 20 }}>
        {prices.map(p => {
          const up = p.direction === "up";
          return (
            <div key={p.pair} onClick={() => setSelP(p.pair)} style={{
              background: selP === p.pair ? C.surf2 : C.surf,
              border: `1px solid ${selP === p.pair ? C.gold : C.border}`,
              borderRadius: 9, padding: 13, cursor: "pointer", transition: "all .15s",
            }}>
              <div style={{ fontWeight: 700, marginBottom: 3 }}>{p.pair}</div>
              <div style={{ fontFamily: "monospace", fontSize: 17, fontWeight: 700, marginBottom: 3 }}>{p.pair === "BTCUSD" ? f2(p.price) : fp(p.price)}</div>
              <div style={{ color: up ? C.green : C.red, fontSize: 11, marginBottom: 6 }}>{fpc(p.change_pct)}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.muted, marginBottom: 2 }}>
                <span>Bid {fp(p.bid, 4)}</span><span>Ask {fp(p.ask, 4)}</span>
              </div>
              <div style={{ fontSize: 9, color: C.muted }}>Spread {p.spread}p · {p.source}</div>
            </div>
          );
        })}
      </div>

      <Card>
        <SectionTitle>Price Chart</SectionTitle>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ minWidth: 130 }}><FG label="Pair"><Sel value={selP} onChange={e => setSelP(e.target.value)} options={PAIRS} /></FG></div>
          <div style={{ minWidth: 100 }}><FG label="Timeframe"><Sel value={selTf} onChange={e => setSelTf(e.target.value)} options={TFS} /></FG></div>
          <Btn col={C.gold} onClick={loadChart} disabled={busy}>{busy ? "Loading…" : "Load Chart"}</Btn>
        </div>
        <ChartWrap label={`${selP} · ${selTf}  |  — EMA20 (gold)  — EMA50 (purple)  - - BB (blue)`}>
          <CandleChart bars={bars} />
        </ChartWrap>
      </Card>
    </div>
  );
}

// ─── Profile / MT5 ────────────────────────────────────────────────────────────
function Profile({ api, user, setUser }) {
  const [form, setForm] = useState({ bio: user?.bio || "", broker: user?.broker || "", mt5_login: user?.mt5_login || "", mt5_server: user?.mt5_server || "" });
  const [busy, setBusy] = useState(false);
  const [ok,   setOk]   = useState("");

  const save = async () => {
    setBusy(true);
    try {
      await api.put("/auth/profile", form);
      setUser(u => ({ ...u, ...form }));
      setOk("Saved!"); setTimeout(() => setOk(""), 2500);
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const F = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ padding: 20 }}>
      <Grid cols="1fr 1fr" gap={16}>
        <Card>
          <SectionTitle>Account Info</SectionTitle>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.gold, color: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{user?.username}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{user?.email}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                <Badge col={C.blue}>{user?.role?.toUpperCase()}</Badge>
                <Badge col={C.purple}>{user?.plan?.toUpperCase()} PLAN</Badge>
              </div>
            </div>
          </div>
          <Grid cols="1fr 1fr" gap={8} style={{ marginBottom: 16 }}>
            {[["Balance", `$${Number(user?.balance || 0).toLocaleString()}`], ["Equity", `$${Number(user?.equity || 0).toLocaleString()}`], ["Broker", user?.broker || "Not set"], ["MT5 Server", user?.mt5_server || "Not connected"]].map(([l, v]) => (
              <div key={l} style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 11 }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>{l}</div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
              </div>
            ))}
          </Grid>
          <FG label="Bio"><Inp rows={2} value={form.bio} onChange={F("bio")} placeholder="Describe your trading style…" /></FG>
          <OkBox msg={ok} />
          <Btn col={C.gold} onClick={save} disabled={busy}>{busy ? "Saving…" : "Save Changes"}</Btn>
        </Card>

        <Card>
          <SectionTitle>MT5 / Broker Connection</SectionTitle>
          <InfoBox col={C.blue}>
            <div style={{ fontWeight: 600, fontSize: 12, color: C.blue, marginBottom: 7 }}>ℹ How to connect your MT5</div>
            <div style={{ fontSize: 11, lineHeight: 1.85, color: C.text, opacity: 0.85 }}>
              1. Open a live/demo account at <strong>FBS, Exness, XM</strong> or any MT5 broker<br />
              2. For $10–$50: choose <strong>FBS Cent Account</strong> ($1 min deposit, nano lots 0.001)<br />
              3. In MetaTrader 5, go to <em>Tools → Options → Server</em> to find your Login & Server<br />
              4. Enter credentials below — the ForexPro EA will auto-connect<br />
              5. Download the <strong>ForexPro EA (.ex5)</strong> file and install in MT5 Experts folder
            </div>
          </InfoBox>
          <FG label="Broker Name"><Inp value={form.broker} onChange={F("broker")} placeholder="FBS, Exness, XM, IC Markets…" /></FG>
          <FG label="MT5 Login Number"><Inp value={form.mt5_login} onChange={F("mt5_login")} placeholder="e.g. 38291047" /></FG>
          <FG label="MT5 Server"><Inp value={form.mt5_server} onChange={F("mt5_server")} placeholder="e.g. FBS-MT5-Demo" /></FG>
          <OkBox msg={ok} />
          <Btn col={C.gold} full onClick={save} disabled={busy}>{busy ? "Connecting…" : "Save & Connect MT5"}</Btn>
          <InfoBox col={C.green} style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, lineHeight: 1.75 }}>
              <strong>Best brokers for $10–$50:</strong><br />
              • <strong>FBS Cent</strong> — $1 min, 1:3000 leverage, nano lots<br />
              • <strong>Exness</strong> — $10 min, ultra-low spreads, FCA regulated<br />
              • <strong>XM</strong> — $5 min, $50 welcome bonus
            </div>
          </InfoBox>
        </Card>
      </Grid>
    </div>
  );
}

// ─── Navigation config ────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", icon: "⊞", label: "Dashboard"    },
  { id: "signals",   icon: "⚡", label: "Signals"      },
  { id: "copy",      icon: "↻", label: "Copy Trading" },
  { id: "providers", icon: "★", label: "Providers"    },
  { id: "education", icon: "🎓", label: "Education"    },
  { id: "journal",   icon: "📖", label: "Journal"      },
  { id: "prices",    icon: "📡", label: "Live Prices"  },
  { id: "profile",   icon: "⚙", label: "Profile / MT5"},
];

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem("fpx_t") || "");
  const [user,  setUser]  = useState(() => { try { return JSON.parse(sessionStorage.getItem("fpx_u") || "null"); } catch { return null; } });
  const [page,  setPage]  = useState("dashboard");

  const api = useApi(token);

  const login = (tok, usr) => {
    setToken(tok); setUser(usr);
    sessionStorage.setItem("fpx_t", tok);
    sessionStorage.setItem("fpx_u", JSON.stringify(usr));
  };

  const logout = () => {
    setToken(""); setUser(null);
    sessionStorage.removeItem("fpx_t");
    sessionStorage.removeItem("fpx_u");
  };

  if (!token || !user) return (
    <>
      <style>{`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0} body{background:${C.bg};color:${C.text};font-family:'Segoe UI',system-ui,sans-serif}`}</style>
      <AuthPage onLogin={login} />
    </>
  );

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:${C.bg};color:${C.text};font-family:'Segoe UI',system-ui,sans-serif;font-size:13px}
        input,select,textarea{outline:none}
        input:focus,select:focus,textarea:focus{border-color:${C.gold}!important}
        button:active{opacity:.82}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${C.bg}}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: "194px 1fr", minHeight: "100vh", background: C.bg }}>

        {/* Sidebar */}
        <aside style={{ background: C.surf, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "15px 14px 11px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.4 }}>Forex<span style={{ color: C.gold }}>Pro</span></div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2.5, marginTop: 2 }}>PROFESSIONAL PLATFORM</div>
          </div>

          <nav style={{ padding: "7px 0", flex: 1 }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)} style={{
                display: "flex", alignItems: "center", gap: 9, padding: "9px 14px", width: "100%",
                background: page === n.id ? C.gold + "16" : "transparent", border: "none",
                color: page === n.id ? C.gold : C.muted, fontSize: 12, fontWeight: 500,
                cursor: "pointer", textAlign: "left", transition: "all .15s",
              }}>
                <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{n.icon}</span>
                {n.label}
              </button>
            ))}
          </nav>

          <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.gold, color: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{user?.username}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{user?.plan?.toUpperCase()} · ${Number(user?.balance || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Ticker api={api} />

          <div style={{ background: C.surf, borderBottom: `1px solid ${C.border}`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{NAV.find(n => n.id === page)?.label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, background: C.green + "18", color: C.green, padding: "3px 9px", borderRadius: 99, fontWeight: 700 }}>● LIVE</span>
              <Btn col={C.gold} ghost onClick={() => setPage("signals")} style={{ fontSize: 11, padding: "5px 12px" }}>⚡ Generate Signal</Btn>
              <Btn col={C.muted} ghost onClick={logout} style={{ fontSize: 11, padding: "5px 12px" }}>Sign Out</Btn>
            </div>
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {page === "dashboard" && <Dashboard  api={api} />}
            {page === "signals"   && <Signals    api={api} />}
            {page === "copy"      && <CopyTrading api={api} />}
            {page === "providers" && <Providers  api={api} />}
            {page === "education" && <Education  api={api} />}
            {page === "journal"   && <Journal    api={api} />}
            {page === "prices"    && <PricesPage api={api} />}
            {page === "profile"   && <Profile    api={api} user={user} setUser={setUser} />}
          </div>
        </div>
      </div>
    </>
  );
}
