// ─── Providers ────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { C } from "../constants.jsx";
import { Card, SectionTitle, Stat, Badge, Row, Grid, Btn, FG, Inp, Sel, Modal, OkBox, InfoBox, ErrBox } from "../shared/Shared.jsx";
import { ago, fp, f1 } from "../utils/utils.js";
import { PAIRS } from "../components/Charts.jsx";

// Lets a follower pick exactly which pairs to auto-copy from a provider.
// Empty = all pairs (mirrors the backend's `not pf` fallback in forexpro_main.py).
function PairsFilterPicker({ value, onChange }) {
  const toggle = (pair) => {
    onChange(value.includes(pair) ? value.filter(p => p !== pair) : [...value, pair]);
  };
  return (
    <FG label={`Pairs to copy (${value.length === 0 ? "all pairs" : value.length + " selected"})`}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {PAIRS.map(pair => {
          const active = value.includes(pair);
          return (
            <button
              key={pair}
              type="button"
              onClick={() => toggle(pair)}
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                border: `1px solid ${active ? C.gold : C.border}`,
                background: active ? `${C.gold}20` : "transparent",
                color: active ? C.gold : C.muted,
              }}
            >
              {pair}
            </button>
          );
        })}
      </div>
    </FG>
  );
}

export default function Providers({ api }) {
  const [list,    setList]    = useState([]);
  const [detail,  setDetail]  = useState(null);
  const [subForm, setSubForm] = useState(null);
  const [myIds,   setMyIds]   = useState([]);
  const [sf,      setSf]      = useState({ risk_pct: 2, max_lot: 0.05, min_confidence: 65, auto_copy: true, auto_execute: false, pairs_filter: [] });
  const [busy,    setBusy]    = useState(false);
  const [ok,      setOk]      = useState("");
  const [bridgeReady, setBridgeReady] = useState(false);
  const [usage, setUsage] = useState(null);

  const [myProvider, setMyProvider] = useState(undefined); // undefined = loading, null = not a provider
  const [followers, setFollowers] = useState(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [regForm, setRegForm]       = useState({ display_name: "", description: "", monthly_fee: 0 });
  const [regModal, setRegModal]     = useState(false);
  const [regBusy,  setRegBusy]      = useState(false);
  const [regErr,   setRegErr]       = useState("");
  const [subErr,   setSubErr]       = useState("");

  const loadMyProvider = () => {
    api.get("/providers/me").then(setMyProvider).catch(() => setMyProvider(null));
  };

  const loadFollowers = () => {
    api.get("/providers/me/followers").then(d => setFollowers(d.followers || [])).catch(() => setFollowers([]));
  };

  useEffect(() => {
    api.get("/providers").then(d => setList(d.providers || [])).catch(() => {});
    api.get("/copy/subscriptions").then(d => setMyIds((d.subscriptions || []).map(s => s.provider_id))).catch(() => {});
    api.get("/bridge/status").then(d => setBridgeReady(!!d.has_token)).catch(() => {});
    api.get("/account/usage").then(setUsage).catch(() => {});
    loadMyProvider();
  }, []);

  const openRegister = () => {
    setRegErr("");
    setRegForm(myProvider ? { display_name: myProvider.display_name, description: myProvider.description, monthly_fee: myProvider.monthly_fee } : { display_name: "", description: "", monthly_fee: 0 });
    setRegModal(true);
  };

  const submitProvider = async () => {
    setRegBusy(true); setRegErr("");
    try {
      const result = myProvider
        ? await api.put("/providers/me", regForm)
        : await api.post("/providers/register", regForm);
      setMyProvider(result);
      setRegModal(false);
      api.get("/providers").then(d => setList(d.providers || [])).catch(() => {});
    } catch (e) {
      setRegErr(e.message || "Something went wrong");
    } finally {
      setRegBusy(false);
    }
  };

  const openDetail = async p => {
    try { setDetail(await api.get(`/providers/${p.id}`)); }
    catch {}
  };

  const subscribe = async () => {
    setBusy(true); setSubErr("");
    try {
      await api.post("/copy/subscribe", { provider_id: subForm.user_id, ...sf });
      setMyIds(p => [...p, subForm.user_id]);
      api.get("/account/usage").then(setUsage).catch(() => {});
      setSubForm(null);
      setOk("✅ Subscribed! Auto-copy is now active.");
      setTimeout(() => setOk(""), 3000);
    } catch (e) { setSubErr(e.message); }
    finally { setBusy(false); }
  };

  const unsub = async uid => {
    try {
      await api.del(`/copy/unsubscribe/${uid}`);
      setMyIds(p => p.filter(x => x !== uid));
      api.get("/account/usage").then(setUsage).catch(() => {});
    }
    catch (e) { alert(e.message); }
  };

  return (
    <div style={{ padding: 20 }}>
      <OkBox msg={ok} />
      <div style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>Discover top signal providers and copy their trades automatically</div>

      {/* Become a provider / my provider profile */}
      {myProvider === null && (
        <Card style={{ background: `linear-gradient(135deg, ${C.gold}14, ${C.surf})`, border: `1px solid ${C.gold}45` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>📈 Become a Signal Provider</div>
              <div style={{ fontSize: 12, color: C.muted }}>
                {usage && !usage.limits.can_be_provider
                  ? "Requires the Provider Pro plan — generate signals under your own name, build a public track record, earn revenue share from followers."
                  : "Generate signals under your own name, build a public track record, and let other traders copy you automatically."}
              </div>
            </div>
            {usage && !usage.limits.can_be_provider ? (
              <NavLink to="/billing" style={{ textDecoration: "none" }}>
                <Btn col={C.gold}>Upgrade to Provider Pro</Btn>
              </NavLink>
            ) : (
              <Btn col={C.gold} onClick={openRegister}>Become a Provider</Btn>
            )}
          </div>
        </Card>
      )}

      {myProvider && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <SectionTitle>My Provider Profile — {myProvider.display_name}</SectionTitle>
            <Btn col={C.gold} ghost onClick={openRegister} style={{ padding: "4px 10px", fontSize: 11 }}>Edit</Btn>
          </div>
          <Grid cols="repeat(4,minmax(0,1fr))" gap={10}>
            <Stat label="Win Rate"   value={`${myProvider.win_rate}%`}   color={C.green} />
            <Stat label="Total Pips" value={`${myProvider.total_pips >= 0 ? "+" : ""}${myProvider.total_pips}`} color={C.blue} />
            <Stat label="Followers" value={myProvider.followers_count}  color={C.purple} />
            <Stat label="Signals"   value={myProvider.total_signals}    color={C.gold} />
          </Grid>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 10, marginBottom: 12 }}>
            Generate signals from the Signals tab — they're automatically attributed to you and count toward these stats once they close.
          </div>

          <Btn col={C.muted} ghost onClick={() => { setShowFollowers(s => !s); if (!followers) loadFollowers(); }} style={{ fontSize: 11, padding: "6px 12px" }}>
            {showFollowers ? "Hide Followers ▲" : `View Followers (${myProvider.followers_count}) ▼`}
          </Btn>

          {showFollowers && (
            followers === null ? (
              <div style={{ fontSize: 12, color: C.muted, padding: "10px 0" }}>Loading…</div>
            ) : followers.length === 0 ? (
              <div style={{ fontSize: 12, color: C.muted, padding: "10px 0" }}>No followers yet — share your provider profile to start growing your audience.</div>
            ) : (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {followers.map(f => (
                  <div key={f.follower_id} style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10,
                                                      border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, fontSize: 12 }}>
                    <strong>{f.username}</strong>
                    <Badge col={C.muted}>{f.plan}</Badge>
                    <Badge col={f.auto_copy ? C.green : C.gold}>{f.auto_copy ? "Auto" : "Manual"}</Badge>
                    <span style={{ color: C.muted, fontSize: 11 }}>Min conf {f.min_confidence}% · Risk {f.risk_pct}% · Max lot {f.max_lot}</span>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 14, fontSize: 11 }}>
                      <span style={{ color: C.muted }}>{f.trades_copied} trades</span>
                      <span style={{ color: f.pnl_from_your_signals >= 0 ? C.green : C.red, fontWeight: 700 }}>
                        {f.pnl_from_your_signals >= 0 ? "+" : ""}${f.pnl_from_your_signals} from your signals
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </Card>
      )}

      {/* Register / edit provider modal */}
      {regModal && (
        <Modal onClose={() => setRegModal(false)}>
          <SectionTitle>{myProvider ? "Edit Provider Profile" : "Become a Provider"}</SectionTitle>
          <FG label="Display name"><Inp value={regForm.display_name} onChange={e => setRegForm(p => ({ ...p, display_name: e.target.value }))} placeholder="e.g. Brian FX Signals" /></FG>
          <FG label="Description"><Inp value={regForm.description} onChange={e => setRegForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe your trading style / strategy" /></FG>
          <FG label="Monthly subscription fee (USD, 0 = free)"><Inp type="number" min="0" step="1" value={regForm.monthly_fee} onChange={e => setRegForm(p => ({ ...p, monthly_fee: +e.target.value }))} /></FG>
          <ErrBox msg={regErr} />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn col={C.gold} onClick={submitProvider} disabled={regBusy || !regForm.display_name}>
              {regBusy ? "Saving…" : myProvider ? "Save Changes" : "Create Provider Profile"}
            </Btn>
            <Btn col={C.muted} ghost onClick={() => setRegModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}

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
                <div style={{  display: "flex",
                                  flexDirection: "row", // Guarantees row alignment on mobile
                                  justifyContent: "space-between",
                                  alignItems: "center"}}>
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
                  : usage && usage.limits.max_subscriptions != null && usage.usage.active_subscriptions >= usage.limits.max_subscriptions
                    ? <NavLink to="/billing" style={{ textDecoration: "none" }} onClick={e => e.stopPropagation()}>
                        <Btn col={C.gold} full>Follow limit reached — Upgrade</Btn>
                      </NavLink>
                    : <Btn col={C.gold} full onClick={e => { e.stopPropagation(); setSubErr(""); setSf({ risk_pct: 2, max_lot: 0.05, min_confidence: 65, auto_copy: true, auto_execute: false, pairs_filter: [] }); setSubForm(p); }}>{p.monthly_fee > 0 ? `Subscribe $${p.monthly_fee}/mo` : "Subscribe Free"}</Btn>}
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
          <PairsFilterPicker value={sf.pairs_filter} onChange={pf => setSf(p => ({ ...p, pairs_filter: pf }))} />
          {bridgeReady ? (
            <FG label="Execution">
              <Sel value={sf.auto_execute ? "1" : "0"} onChange={e => setSf(p => ({ ...p, auto_execute: e.target.value === "1" }))}
                   options={[{ v: "0", l: "Simulated — in-app only" }, { v: "1", l: "Live — real trades on my MT5 (bridge connected)" }]} />
            </FG>
          ) : (
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>
              Copies stay simulated in-app. Connect your MT5 bridge in Profile to enable real execution.
            </div>
          )}
          <InfoBox col={C.gold}><div style={{ fontSize: 11, lineHeight: 1.75 }}><strong>Tip for $10–$50 accounts:</strong> Set risk to 1–2% and max lot to 0.01–0.05 on FBS Cent. This limits loss per trade to $0.10–$1.00.</div></InfoBox>
          <ErrBox msg={subErr} />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn col={C.gold} onClick={subscribe} disabled={busy}>{busy ? "Subscribing…" : "✓ Subscribe & Copy"}</Btn>
            <Btn col={C.muted} ghost onClick={() => setSubForm(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}