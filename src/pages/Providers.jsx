// ─── Providers ────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { C } from "../constants.jsx";
import { Card, SectionTitle, Stat, Badge, Row, Grid, Btn, FG, Inp, Sel, Modal, OkBox, InfoBox } from "../shared/Shared.jsx";
import { ago, fp, f1 } from "../utils/utils.js";

export default function Providers({ api }) {
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