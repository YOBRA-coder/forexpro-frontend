// ─── Copy Trading ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { C } from "../constants.jsx";
import { Card, SectionTitle, Stat, Badge, Row, Grid, Btn, FG, Inp, Sel, Modal } from "../shared/Shared.jsx";
import { ago, fp, f1, usd } from "../utils/utils.js";   

export default function CopyTrading({ api }) {
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