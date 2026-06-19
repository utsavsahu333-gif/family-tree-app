"use client";
import { useEffect, useState } from "react";
import { useToast } from "@/app/components/Toast";

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch {
      addToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateStatus = async (userId: string, status: "APPROVED" | "REJECTED") => {
    setUpdating(userId);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast(
          status === "APPROVED"
            ? `✅ ${data.user.name} has been approved`
            : `❌ ${data.user.name} has been rejected`,
          "success"
        );
        fetchUsers();
      } else {
        addToast(data.error || "Failed to update", "error");
      }
    } catch {
      addToast("Failed to update user", "error");
    } finally {
      setUpdating(null);
    }
  };

  const pendingUsers = users.filter((u) => u.status === "PENDING");
  const approvedUsers = users.filter((u) => u.status === "APPROVED");
  const rejectedUsers = users.filter((u) => u.status === "REJECTED");

  const statusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return { bg: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", border: "rgba(245, 158, 11, 0.2)" };
      case "APPROVED":
        return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "rgba(16, 185, 129, 0.2)" };
      case "REJECTED":
        return { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "rgba(239, 68, 68, 0.2)" };
      default:
        return { bg: "var(--card)", color: "var(--muted)", border: "var(--card-border)" };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderUserCard = (user: UserItem) => {
    const sc = statusColor(user.status);
    return (
      <div
        key={user.id}
        className="glass-card"
        style={{
          padding: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 200 }}>
          <div
            className="avatar"
            style={{
              width: 44,
              height: 44,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{user.name}</span>
              {user.role === "ADMIN" && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "rgba(168, 85, 247, 0.1)",
                    color: "#a855f7",
                  }}
                >
                  👑 Admin
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{user.email}</p>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, opacity: 0.7 }}>
              Joined {formatDate(user.createdAt)}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Status badge */}
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 12px",
              borderRadius: 8,
              background: sc.bg,
              color: sc.color,
              border: `1px solid ${sc.border}`,
            }}
          >
            {user.status === "PENDING" && "⏳ "}
            {user.status === "APPROVED" && "✅ "}
            {user.status === "REJECTED" && "❌ "}
            {user.status}
          </span>

          {/* Action buttons */}
          {user.status !== "APPROVED" && user.role !== "ADMIN" && (
            <button
              onClick={() => updateStatus(user.id, "APPROVED")}
              disabled={updating === user.id}
              style={{
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                border: "1px solid rgba(16, 185, 129, 0.3)",
                background: "rgba(16, 185, 129, 0.1)",
                color: "#10b981",
                cursor: "pointer",
                opacity: updating === user.id ? 0.5 : 1,
                fontFamily: "inherit",
              }}
            >
              ✅ Approve
            </button>
          )}
          {user.status !== "REJECTED" && user.role !== "ADMIN" && (
            <button
              onClick={() => updateStatus(user.id, "REJECTED")}
              disabled={updating === user.id}
              style={{
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                border: "1px solid rgba(239, 68, 68, 0.3)",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                cursor: "pointer",
                opacity: updating === user.id ? 0.5 : 1,
                fontFamily: "inherit",
              }}
            >
              ❌ Reject
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ textAlign: "center", padding: 64 }}>
        <div className="animate-float" style={{ fontSize: 48 }}>👥</div>
        <p style={{ color: "var(--muted)", marginTop: 16 }}>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>User Management</h1>
        <p style={{ fontSize: 14, color: "var(--muted)" }}>
          Approve or reject user registrations · {users.length} total user{users.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Pending section — highlighted */}
      {pendingUsers.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b" }}>
              ⏳ Pending Approval
            </h2>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "2px 10px",
                borderRadius: 12,
                background: "rgba(245, 158, 11, 0.15)",
                color: "#f59e0b",
              }}
            >
              {pendingUsers.length}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingUsers.map(renderUserCard)}
          </div>
        </div>
      )}

      {/* Approved section */}
      {approvedUsers.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#10b981", marginBottom: 14 }}>
            ✅ Approved ({approvedUsers.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {approvedUsers.map(renderUserCard)}
          </div>
        </div>
      )}

      {/* Rejected section */}
      {rejectedUsers.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#ef4444", marginBottom: 14 }}>
            ❌ Rejected ({rejectedUsers.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rejectedUsers.map(renderUserCard)}
          </div>
        </div>
      )}

      {users.length === 0 && (
        <div className="glass-card" style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 48, opacity: 0.5, marginBottom: 12 }}>👤</div>
          <p style={{ color: "var(--muted)" }}>No users yet</p>
        </div>
      )}
    </div>
  );
}
