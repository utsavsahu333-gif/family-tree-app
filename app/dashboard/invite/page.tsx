"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/app/components/Toast";

interface Invite {
  id: string; email: string; accepted: boolean; createdAt: string; expiresAt: string;
}

export default function InvitePage() {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvites = () => {
    fetch("/api/invites").then(r => r.json()).then(d => setInvites(d.invites || [])).catch(console.error);
  };
  useEffect(() => { fetchInvites(); }, []);

  const handleSend = async (e: React.FormEvent) => {
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

  return (
    <div className="animate-fade-in" style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Invite Family Members</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>Send email invitations so your family can join and contribute</p>

      <form onSubmit={handleSend} className="glass-card" style={{ padding: 24, display: "flex", gap: 12, marginBottom: 32, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Email Address</label>
          <input type="email" className="input-field" placeholder="relative@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary" disabled={loading} style={{ whiteSpace: "nowrap" }}>
          {loading ? "Sending..." : "✉️ Send Invite"}
        </button>
      </form>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Sent Invitations</h2>
      {invites.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
          <div style={{ fontSize: 40, opacity: 0.5, marginBottom: 12 }}>✉️</div>
          <p>No invites sent yet</p>
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
