// ─── Auth page ────────────────────────────────────────────────────────────────
import { useState } from "react";
import { C } from "../constants.jsx";
import { Btn, Inp, FG, ErrBox } from "../shared/Shared.jsx";

export default function AuthPage({ onLogin }) {
  const [tab,  setTab]  = useState("login");
  const [form, setForm] = useState({ email: "yobby@forexpro.com", password: "demo123", username: "" });
  const [err,  setErr]  = useState("");
  const [busy, setBusy] = useState(false);

 const API = "https://forexpro-backend-7ik2.onrender.com";

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