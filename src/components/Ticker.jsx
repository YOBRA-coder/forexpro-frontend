// ─── Ticker bar ───────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { C } from "../constants.jsx";
import { fp, f2, fpc, usd } from "../utils/utils.js";
import { PAIRS } from "./Charts.jsx";

const WS = "wss://forexpro-backend-7ik2.onrender.com/prices/live?pairs=" + PAIRS.join(",");
export default function Ticker({ api }) {
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
    const poll = () => api.get("/prices/live?pairs=" + PAIRS.join(","))
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