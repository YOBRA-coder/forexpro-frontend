// ─── Notifications ────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { C } from "../constants.jsx";
import { Card, SectionTitle, Btn, useMobile } from "../shared/Shared.jsx";
import { ago } from "../utils/utils.js";

const ICONS = { signal: "⚡", copy: "🔁", trade_closed: "✅", billing: "💳", system: "🔔" };

export default function Notifications({ api, onRead }) {
  const [notifs, setNotifs] = useState(null);
  const [busy, setBusy] = useState(false);
  const mobile = useMobile();

  const load = () => api.get("/notifications").then(d => setNotifs(d.notifications || [])).catch(() => setNotifs([]));

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    try { await api.post(`/notifications/${id}/read`, {}); onRead && onRead(); } catch {}
  };

  const markAllRead = async () => {
    setBusy(true);
    try {
      await api.post("/notifications/read-all", {});
      setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })));
      onRead && onRead();
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const unreadCount = (notifs || []).filter(n => !n.is_read).length;

  return (
    <div style={{ padding: mobile ? 12 : 20, maxWidth: 700, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <SectionTitle>Notifications {unreadCount > 0 && <span style={{ color: C.gold }}>({unreadCount} new)</span>}</SectionTitle>
        {unreadCount > 0 && (
          <Btn col={C.muted} ghost onClick={markAllRead} disabled={busy} style={{ fontSize: 11, padding: "6px 12px" }}>
            {busy ? "…" : "Mark all read"}
          </Btn>
        )}
      </div>

      <Card>
        {notifs === null ? (
          <div style={{ color: C.muted, fontSize: 12, padding: 12 }}>Loading…</div>
        ) : notifs.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 12, padding: 12 }}>You're all caught up — no notifications yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {notifs.map(n => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  padding: "12px 6px",
                  borderBottom: `1px solid ${C.border}30`,
                  background: n.is_read ? "transparent" : `${C.gold}0c`,
                  cursor: n.is_read ? "default" : "pointer",
                }}
              >
                <span style={{ fontSize: 18, lineHeight: "20px" }}>{ICONS[n.type] || "🔔"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <strong style={{ fontSize: 13 }}>{n.title}</strong>
                    <span style={{ fontSize: 10, color: C.muted, whiteSpace: "nowrap" }}>{ago(n.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 3, wordBreak: "break-word" }}>{n.message}</div>
                </div>
                {!n.is_read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.gold, marginTop: 5, flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
