"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function PendingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; status: string } | null>(null);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        if (data.user.status === "APPROVED") {
          router.push("/dashboard");
        }
      }
    } catch {
      // Ignore
    } finally {
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background)",
        padding: 20,
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          maxWidth: 480,
          width: "100%",
          padding: "48px 40px",
          textAlign: "center",
        }}
      >
        {/* Animated hourglass */}
        <div
          className="animate-float"
          style={{
            fontSize: 64,
            marginBottom: 24,
          }}
        >
          ⏳
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "var(--foreground)",
            marginBottom: 8,
          }}
        >
          Account Pending Approval
        </h1>

        <p
          style={{
            fontSize: 15,
            color: "var(--muted)",
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          {user
            ? `Hi ${user.name}! Your account (${user.email}) is waiting for admin approval. You'll get access once the admin approves your request.`
            : "Your account is waiting for admin approval. Please check back later."}
        </p>

        {/* Status indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "14px 24px",
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: 12,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#f59e0b",
              animation: "pulse 2s infinite",
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#f59e0b" }}>
            Pending Review
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={checkStatus}
            disabled={checking}
            className="btn-primary"
            style={{ opacity: checking ? 0.6 : 1 }}
          >
            {checking ? "Checking..." : "🔄 Check Status"}
          </button>
          <button
            onClick={handleLogout}
            className="btn-danger"
            style={{
              padding: "10px 20px",
              fontSize: 14,
            }}
          >
            Sign Out
          </button>
        </div>

        {/* Auto-poll notice */}
        <p
          style={{
            fontSize: 12,
            color: "var(--muted)",
            marginTop: 24,
            opacity: 0.6,
          }}
        >
          Auto-checking every 30 seconds · You&apos;ll be redirected when approved
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
