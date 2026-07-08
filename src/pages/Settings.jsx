// ─── Settings ─────────────────────────────────────────────────────────────────
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { C } from "../constants.jsx";
import { Card, SectionTitle, Btn, FG, Inp, Sel, OkBox, ErrBox, useMobile } from "../shared/Shared.jsx";

export default function Settings({ api, user, setUser }) {
  const mobile = useMobile();
  const [prefs, setPrefs] = useState({
    email_alerts_enabled: user?.email_alerts_enabled !== 0,
    default_lot_size: user?.default_lot_size ?? 0.02,
    default_risk_pct: user?.default_risk_pct ?? 2,
  });
  const [pwd, setPwd] = useState({ current_password: "", new_password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [pwdBusy, setPwdBusy] = useState(false);
  const [ok, setOk] = useState("");
  const [pwdOk, setPwdOk] = useState("");
  const [err, setErr] = useState("");
  const [pwdErr, setPwdErr] = useState("");

  const saveTrading = async () => {
    setBusy(true); setErr(""); setOk("");
    try {
      const res = await api.put("/auth/settings", prefs);
      setUser(u => ({ ...u, ...res.user }));
      setOk("Saved");
      setTimeout(() => setOk(""), 2500);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const savePassword = async () => {
    setPwdErr(""); setPwdOk("");
    if (pwd.new_password !== pwd.confirm) { setPwdErr("New passwords don't match"); return; }
    if (pwd.new_password.length < 8) { setPwdErr("New password must be at least 8 characters"); return; }
    setPwdBusy(true);
    try {
      await api.post("/auth/change-password", { current_password: pwd.current_password, new_password: pwd.new_password });
      setPwd({ current_password: "", new_password: "", confirm: "" });
      setPwdOk("Password updated");
      setTimeout(() => setPwdOk(""), 2500);
    } catch (e) { setPwdErr(e.message); }
    finally { setPwdBusy(false); }
  };

  return (
    <div style={{ padding: mobile ? 12 : 20, maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionTitle>Settings</SectionTitle>

      <Card>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Notifications</div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.text, cursor: "pointer", marginBottom: 4 }}>
          <input
            type="checkbox"
            checked={prefs.email_alerts_enabled}
            onChange={e => setPrefs(p => ({ ...p, email_alerts_enabled: e.target.checked }))}
          />
          Email me when a signal auto-copies or a trade closes
        </label>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>
          In-app notifications (bell icon) always stay on — this only controls email alerts.
        </div>

        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Default trade sizing</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
          <FG label="Default lot size">
            <Inp type="number" step="0.01" value={prefs.default_lot_size}
                 onChange={e => setPrefs(p => ({ ...p, default_lot_size: Number(e.target.value) }))} />
          </FG>
          <FG label="Default risk %">
            <Inp type="number" step="0.5" value={prefs.default_risk_pct}
                 onChange={e => setPrefs(p => ({ ...p, default_risk_pct: Number(e.target.value) }))} />
          </FG>
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>
          Used as the starting point when you manually copy a signal from the Signals page.
        </div>

        {ok && <OkBox msg={ok} />}
        <ErrBox msg={err} />
        <Btn col={C.gold} onClick={saveTrading} disabled={busy}>{busy ? "Saving…" : "Save Settings"}</Btn>
      </Card>

      <Card>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Change password</div>
        <FG label="Current password"><Inp type="password" value={pwd.current_password} onChange={e => setPwd(p => ({ ...p, current_password: e.target.value }))} /></FG>
        <FG label="New password"><Inp type="password" value={pwd.new_password} onChange={e => setPwd(p => ({ ...p, new_password: e.target.value }))} /></FG>
        <FG label="Confirm new password"><Inp type="password" value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} /></FG>
        {pwdOk && <OkBox msg={pwdOk} />}
        <ErrBox msg={pwdErr} />
        <Btn col={C.gold} onClick={savePassword} disabled={pwdBusy}>{pwdBusy ? "Updating…" : "Update Password"}</Btn>
      </Card>

      <Card>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>MT5 connection</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
          Managed from your Profile page — broker, login/server display, and the bridge token for live copy execution.
        </div>
        <NavLink to="/profile"><Btn col={C.muted} ghost>Go to Profile →</Btn></NavLink>
      </Card>
    </div>
  );
}
