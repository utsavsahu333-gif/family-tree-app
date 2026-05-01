"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalMembers: number;
  totalEvents: number;
  recentEvents: { id: string; title: string; type: string; date: string; member: { firstName: string; lastName: string } }[];
}

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/members").then((r) => r.json()),
      fetch("/api/events").then((r) => r.json()),
    ]).then(([userData, membersData, eventsData]) => {
      setUser(userData.user);
      setStats({
        totalMembers: membersData.members?.length || 0,
        totalEvents: eventsData.events?.length || 0,
        recentEvents: (eventsData.events || []).slice(0, 5),
      });
    }).catch(console.error);
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
          {greeting()}{user ? `, ${user.name.split(" ")[0]}` : ""} 👋
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 15 }}>
          Here&apos;s what&apos;s happening with your family tree
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
        marginBottom: 32,
      }}>
        {[
          {
            icon: "👥", label: "Family Members",
            value: stats?.totalMembers ?? "—",
            color: "rgba(16, 185, 129, 0.1)",
            href: "/dashboard/members",
          },
          {
            icon: "📅", label: "Life Events",
            value: stats?.totalEvents ?? "—",
            color: "rgba(245, 158, 11, 0.1)",
            href: "/dashboard/timeline",
          },
          {
            icon: "🌳", label: "Family Tree",
            value: "View →",
            color: "rgba(59, 130, 246, 0.1)",
            href: "/dashboard/tree",
          },
          {
            icon: "✉️", label: "Invite Family",
            value: "Send →",
            color: "rgba(168, 85, 247, 0.1)",
            href: "/dashboard/invite",
          },
        ].map((card, i) => (
          <Link
            key={i}
            href={card.href}
            className="glass-card"
            style={{
              padding: 24, textDecoration: "none", color: "inherit",
              animationDelay: `${i * 0.1}s`,
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: card.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, marginBottom: 14,
            }}>
              {card.icon}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {card.value}
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{
        display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap",
      }}>
        <Link href="/dashboard/members/new" className="btn-primary">
          + Add Family Member
        </Link>
        <Link href="/dashboard/tree" className="btn-secondary">
          🌳 View Tree
        </Link>
      </div>

      {/* Recent Events */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Recent Events
        </h2>
        {stats?.recentEvents && stats.recentEvents.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stats.recentEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "12px 16px", borderRadius: 10,
                  background: "var(--background)",
                }}
              >
                <span style={{ fontSize: 20 }}>
                  {event.type === "BIRTH" ? "🎂" : event.type === "MARRIAGE" ? "💍" : event.type === "DEATH" ? "🕊️" : "📌"}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{event.title}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {event.member.firstName} {event.member.lastName} · {new Date(event.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
            <p>No events yet. Add family members to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
