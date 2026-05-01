"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/app/components/Toast";

interface Invite {
  id: string; email: string; accepted: boolean; createdAt: string; expiresAt: string;
}

export default function InvitePage() {
  const { addToast } = useToast();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"whatsapp" | "email" | "link">("whatsapp");
  const [copySuccess, setCopySuccess] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const registerLink = `${appUrl}/register`;

  const fetchInvites = () => {
    fetch("/api/invites").then(r => r.json()).then(d => setInvites(d.invites || [])).catch(console.error);
  };
  useEffect(() => { fetchInvites(); }, []);

  const handleWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) { addToast("Enter a valid phone number", "error"); return; }
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = encodeURIComponent(
      `🌳 Hey! You're invited to join our Family Tree!\n\nClick this link to register and start exploring our family history:\n👉 ${registerLink}\n\nSee you there! ❤️`
    );
    window.open(`https://wa.me/${fullPhone}?text=${message}`, "_blank");
    addToast("WhatsApp opened! Send the message to invite.", "success");
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { addToast(data.error || "Failed to send invite", "error"); }
      else { addToast(`Invite sent to ${email}!`, "success"); setEmail(""); fetchInvites(); }
    } catch { addToast("Something went wrong", "error"); }
    setLoading(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registerLink).then(() => {
      setCopySuccess(true);
      addToast("Link copied! Share it anywhere.", "success");
      setTimeout(() => setCopySuccess(false), 3000);
    });
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Invite Family Members</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>Send invitations via WhatsApp, email, or share a direct link</p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--card)", borderRadius: 10, padding: 4, border: "1px solid var(--card-border)" }}>
        {([
          { id: "whatsapp" as const, label: "📱 WhatsApp", color: "#25D366" },
          { id: "email" as const, label: "✉️ Email" },
          { id: "link" as const, label: "🔗 Copy Link" },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "10px 16px", borderRadius: 8, border: "none",
            background: tab === t.id ? (t.id === "whatsapp" ? "rgba(37,211,102,0.12)" : "var(--background)") : "transparent",
            fontWeight: tab === t.id ? 600 : 400, fontSize: 14, cursor: "pointer",
            color: tab === t.id && t.id === "whatsapp" ? "#25D366" : "var(--foreground)",
            fontFamily: "inherit",
            boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* WhatsApp Tab */}
      {tab === "whatsapp" && (
        <form onSubmit={handleWhatsApp} className="glass-card" style={{ padding: 24, marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "linear-gradient(135deg, #25D366, #128C7E)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
            }}>📱</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Send via WhatsApp</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Opens WhatsApp with a pre-filled invite message</div>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Phone Number</label>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{
                padding: "10px 14px", background: "var(--background)", borderRadius: 10,
                border: "1px solid var(--card-border)", fontSize: 14, color: "var(--muted)",
                display: "flex", alignItems: "center", fontWeight: 600,
              }}>+91</div>
              <input
                type="tel"
                className="input-field"
                placeholder="9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ flex: 1 }}
                maxLength={10}
                required
              />
            </div>
          </div>
          <button type="submit" style={{
            width: "100%", padding: "14px 24px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #25D366, #128C7E)",
            color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
            fontFamily: "inherit",
          }}>
            📲 Open WhatsApp & Send Invite
          </button>
        </form>
      )}

      {/* Email Tab */}
      {tab === "email" && (
        <form onSubmit={handleEmail} className="glass-card" style={{ padding: 24, marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
            }}>✉️</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Send via Email</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Send a tracked email invitation</div>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Email Address</label>
            <input type="email" className="input-field" placeholder="relative@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "14px 24px" }}>
            {loading ? "Sending..." : "✉️ Send Email Invite"}
          </button>
        </form>
      )}

      {/* Copy Link Tab */}
      {tab === "link" && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
            }}>🔗</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Share Registration Link</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Copy & share anywhere — SMS, Telegram, Instagram, etc.</div>
            </div>
          </div>
          <div style={{
            display: "flex", gap: 8, padding: 12, background: "var(--background)",
            borderRadius: 10, border: "1px solid var(--card-border)", marginBottom: 16,
            alignItems: "center",
          }}>
            <code style={{ flex: 1, fontSize: 13, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {registerLink}
            </code>
          </div>
          <button onClick={handleCopyLink} style={{
            width: "100%", padding: "14px 24px", borderRadius: 12, border: "none",
            background: copySuccess ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #a855f7, #7c3aed)",
            color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
            fontFamily: "inherit", transition: "background 0.3s",
          }}>
            {copySuccess ? "✅ Copied!" : "📋 Copy Link to Clipboard"}
          </button>
        </div>
      )}

      {/* Sent Invitations */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Sent Invitations</h2>
      {invites.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
          <div style={{ fontSize: 40, opacity: 0.5, marginBottom: 12 }}>✉️</div>
          <p>No email invites sent yet</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {invites.map(inv => (
            <div key={inv.id} className="glass-card" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{inv.email}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  Sent {new Date(inv.createdAt).toLocaleDateString()} · Expires {new Date(inv.expiresAt).toLocaleDateString()}
                </div>
              </div>
              <span className={`badge ${inv.accepted ? "badge-birth" : "badge-marriage"}`}>
                {inv.accepted ? "✓ Accepted" : "⏳ Pending"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
