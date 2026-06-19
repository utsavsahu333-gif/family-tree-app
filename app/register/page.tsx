"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, inviteToken }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }
      if (data.user?.status === "PENDING") {
        router.push("/pending");
      } else {
        router.push("/dashboard");
      }
    } catch { setError("Something went wrong"); setLoading(false); }
  };

  return (
    <div className="hero-gradient" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="glass-card animate-scale-in" style={{ width: "100%", maxWidth: 440, padding: 40 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="animate-float" style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{inviteToken ? "You're Invited!" : "Create Your Tree"}</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>{inviteToken ? "Join your family's tree" : "Start building your family history"}</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && <div style={{ padding: "12px 16px", borderRadius: 10, fontSize: 13, background: "rgba(239,68,68,0.1)", color: "#ef4444", fontWeight: 500 }}>{error}</div>}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Name</label>
            <input type="text" className="input-field" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Email</label>
            <input type="email" className="input-field" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Password</label>
            <input type="password" className="input-field" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "14px 24px", marginTop: 8 }}>{loading ? "Creating account..." : "Create Account →"}</button>
        </form>
        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--muted)" }}>
          Already have an account? <Link href="/login" style={{ color: "#10b981", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}><RegisterForm /></Suspense>;
}
