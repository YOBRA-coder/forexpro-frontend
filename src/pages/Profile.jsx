// ─── Profile / MT5 ────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { C } from "../constants.jsx";
import { Card, SectionTitle, Stat, Badge, Row, Grid, Btn, FG, Inp, Sel, Modal, OkBox, InfoBox } from "../shared/Shared.jsx";
import { ago, fp, f1 } from "../utils/utils.js";
export default function Profile({ api, user, setUser }) {
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
