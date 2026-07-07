// ─── Billing / Subscription ────────────────────────────────────────────────────
// Handles the two payment moments the platform needs:
//   • Registration — one-time fee, unlocks full access after signup
//   • Subscription — monthly plan upgrade (M-Pesa STK push or Stripe card)
import { useState, useEffect, useRef, useCallback } from "react";
import { C } from "../constants.jsx";
import { Card, SectionTitle, Grid, Btn, FG, Inp, ErrBox, OkBox, Badge, Modal, Pill } from "../shared/Shared.jsx";
import { useMobile } from "../shared/Shared.jsx";
function money(n, ccy) {
  if (!n) return ccy === "KES" ? "KES 0" : "$0";
  return ccy === "KES" ? `KES ${Number(n).toLocaleString()}` : `$${Number(n).toFixed(2)}`;
}

// ── M-Pesa STK push modal: phone entry -> push -> poll status ──
function MpesaModal({ api, kind, plan, amount, onClose, onSuccess }) {
  const [phone, setPhone]   = useState("");
  const [stage, setStage]   = useState("input"); // input | pushed | success | failed
  const [err, setErr]       = useState("");
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const push = async () => {
    setErr("");
    if (!/^(0|\+?254)?7\d{8}$/.test(phone.replace(/\s/g, ""))) {
      setErr("Enter a valid Safaricom number, e.g. 0712345678");
      return;
    }
    try {
      const res = await api.post("/payments/mpesa/stkpush", { phone, kind, plan });
      setStage("pushed");
      let tries = 0;
      pollRef.current = setInterval(async () => {
        tries += 1;
        try {
          const s = await api.post("/payments/mpesa/status", { checkout_request_id: res.checkout_request_id });
          if (s.status === "success") {
            clearInterval(pollRef.current);
            setStage("success");
            onSuccess && onSuccess();
          } else if (s.status === "failed") {
            clearInterval(pollRef.current);
            setStage("failed");
          }
        } catch { /* keep polling */ }
        if (tries > 40) { clearInterval(pollRef.current); setStage("failed"); }
      }, 3000);
    } catch (e) {
      setErr(e.message || "Could not start M-Pesa payment");
    }
  };

  return (
    <Modal onClose={onClose}>
      <SectionTitle>M-Pesa Payment</SectionTitle>
      <div style={{ fontSize: 13, marginBottom: 14 }}>
        {kind === "registration" ? "One-time registration fee" : `${plan} — monthly subscription`}: <strong style={{ color: C.gold }}>{money(amount, "KES")}</strong>
      </div>

      {stage === "input" && (
        <>
          <FG label="M-Pesa phone number">
            <Inp placeholder="0712345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FG>
          <ErrBox msg={err} />
          <Btn col={C.green} full onClick={push}>Send STK Push</Btn>
        </>
      )}

      {stage === "pushed" && (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div style={{ width: 34, height: 34, margin: "0 auto 14px", border: `3px solid ${C.border}`, borderTopColor: C.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: 12, color: C.text, marginBottom: 4 }}>Check your phone — enter your M-Pesa PIN to complete payment.</div>
          <div style={{ fontSize: 11, color: C.muted }}>Waiting for confirmation…</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {stage === "success" && (
        <>
          <OkBox msg="Payment received! Your access has been updated." />
          <Btn col={C.gold} full onClick={onClose}>Done</Btn>
        </>
      )}

      {stage === "failed" && (
        <>
          <ErrBox msg="Payment wasn't completed — it may have timed out or been cancelled." />
          <Btn col={C.gold} full onClick={() => setStage("input")}>Try Again</Btn>
        </>
      )}
    </Modal>
  );
}

export default function Billing({ api, user, setUser }) {
  const [plans, setPlans]     = useState(null);
  const [ccy, setCcy]         = useState("KES"); // KES (M-Pesa) | USD (card)
  const [modal, setModal]     = useState(null);  // { kind, plan, amount }
  const [busy, setBusy]       = useState("");
  const [err, setErr]         = useState("");
  const [usage, setUsage]     = useState(null);
  const mobile = useMobile();

  useEffect(() => {
    api.get("/payments/plans").then(setPlans).catch((e) => setErr(e.message));
    api.get("/account/usage").then(setUsage).catch(() => {});
  }, [api]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.get("/auth/me");
      setUser && setUser(me);
      localStorage.setItem("fpx_u", JSON.stringify(me));
      api.get("/account/usage").then(setUsage).catch(() => {});
    } catch { /* ignore */ }
  }, [api, setUser]);

  const startStripe = async (kind, plan) => {
    setBusy(plan || kind); setErr("");
    try {
      const path = kind === "registration" ? "/payments/checkout/registration" : "/payments/checkout";
      const body = kind === "registration"
        ? { user_id: user.id, user_email: user.email }
        : { plan, user_id: user.id, user_email: user.email };
      const res = await api.post(path, body);
      window.location.href = res.checkout_url;
    } catch (e) {
      setErr(e.message || "Could not start checkout");
    } finally {
      setBusy("");
    }
  };

  const registrationPaid = !!user?.registration_paid;
  const active = user?.subscription_active;

  return (
 <div style={{ padding: mobile ? "12px 12px 80px 12px" : 20, maxWidth: "100%", boxSizing: "border-box", }}>
      {!registrationPaid && (
        <Card style={{
          background: `linear-gradient(135deg, ${C.gold}18, ${C.surf})`,
          border: `1px solid ${C.gold}55`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>🔓 Unlock Full Access</div>
              <div style={{ fontSize: 12, color: C.muted }}>
                A one-time registration fee of {plans ? money(plans.registration_fee.kes, "KES") : "…"} ({plans ? money(plans.registration_fee.usd, "USD") : ""}) activates your account.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn col={C.green} onClick={() => setModal({ kind: "registration", plan: null, amount: plans?.registration_fee.kes })}>Pay via M-Pesa</Btn>
              <Btn col={C.gold} ghost onClick={() => startStripe("registration")} disabled={busy === "registration"}>
                {busy === "registration" ? "Redirecting…" : "Pay via Card"}
              </Btn>
            </div>
          </div>
        </Card>
      )}

      {usage && (
        <Card>
          <SectionTitle>Your Plan — {usage.plan.replace("_", " ").toUpperCase()}</SectionTitle>
          <Grid cols="repeat(4,1fr)" mobileCols="1fr" gap={10}>
            <UsageStat label="Signals today"
              value={usage.limits.signals_per_day == null ? "Unlimited" : `${usage.usage.signals_today}/${usage.limits.signals_per_day}`}
              full={usage.limits.signals_per_day != null && usage.usage.signals_today >= usage.limits.signals_per_day} />
            <UsageStat label="Manual copies today"
              value={usage.limits.copies_per_day == null ? "Unlimited" : `${usage.usage.copies_today}/${usage.limits.copies_per_day}`}
              full={usage.limits.copies_per_day != null && usage.usage.copies_today >= usage.limits.copies_per_day} />
            <UsageStat label="Providers followed"
              value={usage.limits.max_subscriptions == null ? "Unlimited" : `${usage.usage.active_subscriptions}/${usage.limits.max_subscriptions}`}
              full={usage.limits.max_subscriptions != null && usage.usage.active_subscriptions >= usage.limits.max_subscriptions} />
            <UsageStat label="Become a provider"
              value={usage.is_provider ? "Registered" : usage.limits.can_be_provider ? "Available" : "Requires Provider Pro"}
              full={!usage.limits.can_be_provider && !usage.is_provider} />
          </Grid>
        </Card>
      )}

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SectionTitle>Subscription Plans</SectionTitle>
          <div style={{ display: "flex", gap: 4 }}>
            <Pill on={ccy === "KES"} onClick={() => setCcy("KES")}>KES · M-Pesa</Pill>
            <Pill on={ccy === "USD"} onClick={() => setCcy("USD")}>USD · Card</Pill>
          </div>
        </div>

        <ErrBox msg={err} />
        {active && user?.plan !== "free" && (
          <OkBox msg={`Your ${user.plan} plan is active${user.subscription_expires_at ? ` until ${String(user.subscription_expires_at).slice(0, 10)}` : ""}.`} />
        )}

        {!plans ? (
          <div style={{ color: C.muted, fontSize: 12 }}>Loading plans…</div>
        ) : (
          <Grid cols="repeat(4,1fr)" mobileCols="1fr" gap={12}>
            {plans.plans.map((p) => {
              const isCurrent = user?.plan === p.id;
              const price = ccy === "KES" ? p.price_kes : p.price_usd;
              return (
                <div key={p.id} style={{
                  background: C.surf2, border: `1px solid ${p.popular ? C.gold : C.border}`,
                  borderRadius: 10, padding: 16, position: "relative", display: "flex", flexDirection: "column",
                }}>
                  {p.popular && (
                    <span style={{ position: "absolute", top: -10, left: 14, background: C.gold, color: C.bg, fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>POPULAR</span>
                  )}
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.gold, marginBottom: 2, fontFamily: "monospace" }}>
                    {money(price, ccy)}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 12 }}>{p.per ? `per ${p.per}` : "forever"}</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", flex: 1 }}>
                    {p.features.map((f) => (
                      <li key={f} style={{ fontSize: 11, color: C.text, marginBottom: 6, display: "flex", gap: 6 }}>
                        <span style={{ color: C.green }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Badge col={C.green}>Current Plan</Badge>
                  ) : p.id === "free" ? (
                    <Btn col={C.muted} ghost full disabled>Free Tier</Btn>
                  ) : ccy === "KES" ? (
                    <Btn col={C.green} full onClick={() => setModal({ kind: "subscription", plan: p.id, amount: p.price_kes })}>
                      {p.cta} via M-Pesa
                    </Btn>
                  ) : (
                    <Btn col={C.gold} full onClick={() => startStripe("subscription", p.id)} disabled={busy === p.id}>
                      {busy === p.id ? "Redirecting…" : `${p.cta} via Card`}
                    </Btn>
                  )}
                </div>
              );
            })}
          </Grid>
        )}
      </Card>

      {modal && (
        <MpesaModal
          api={api}
          kind={modal.kind}
          plan={modal.plan}
          amount={modal.amount}
          onClose={() => setModal(null)}
          onSuccess={refreshUser}
        />
      )}
    </div>
  );
}

function UsageStat({ label, value, full }) {
  return (
    <div style={{ background: C.surf2, border: `1px solid ${full ? C.gold + "55" : C.border}`, borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: full ? C.gold : C.text }}>{value}</div>
    </div>
  );
}
