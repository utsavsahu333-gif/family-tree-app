"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user)).catch(console.error);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Settings</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>Manage your account</p>

      {user && (
        <div className="glass-card" style={{ padding: 32, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>{user.name}</h2>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>{user.email}</p>
              <span className={`badge ${user.role === "ADMIN" ? "badge-marriage" : "badge-birth"}`}>
                {user.role === "ADMIN" ? "👑 Admin" : "👤 Member"}
              </span>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Account Info</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: "var(--muted)" }}>Email</span>
                <span>{user.email}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: "var(--muted)" }}>Role</span>
                <span>{user.role}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--danger)" }}>Danger Zone</h3>
        <button onClick={handleLogout} className="btn-danger">
          Sign Out
        </button>
      </div>
    </div>
  );
}
