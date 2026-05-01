"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/dashboard/tree", label: "Family Tree", icon: "🌳" },
  { href: "/dashboard/members", label: "Members", icon: "👥" },
  { href: "/dashboard/timeline", label: "Timeline", icon: "📅" },
  { href: "/dashboard/invite", label: "Invite", icon: "✉️" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.user && setUser(d.user))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      <style>{`
        .desktop-sidebar { display: flex; }
        .mobile-topbar { display: none; }
        .mobile-bottomnav { display: none; }

        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .mobile-bottomnav { display: flex !important; }
        }
      `}</style>

      {/* Desktop sidebar */}
      <aside
        className="desktop-sidebar"
        style={{
          position: "fixed", left: 0, top: 0, bottom: 0, width: 260,
          background: "var(--card)", borderRight: "1px solid var(--card-border)",
          flexDirection: "column", zIndex: 50,
          padding: "24px 16px",
        }}
      >
        {/* Logo */}
        <Link href="/dashboard" style={{ textDecoration: "none", marginBottom: 32, padding: "0 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg, #065f46, #10b981)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>
              🌳
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>
                Family Tree
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>
                Your family story
              </div>
            </div>
          </div>
        </Link>

        {/* Nav links */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive(item.href) ? "active" : ""}`}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        {user && (
          <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 8px", marginBottom: 8 }}>
              <div className="avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.role === "ADMIN" ? "👑 Admin" : "Member"}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile top bar */}
      <div
        className="mobile-topbar"
        style={{
          position: "fixed", top: 0, left: 0, right: 0,
          background: "var(--card)", borderBottom: "1px solid var(--card-border)",
          alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>🌳</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Family Tree</span>
        </div>
        {user && (
          <div className="avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="mobile-bottomnav"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "var(--card)", borderTop: "1px solid var(--card-border)",
          justifyContent: "space-around", padding: "8px 0",
          zIndex: 50,
        }}
      >
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              fontSize: 10, fontWeight: isActive(item.href) ? 600 : 400,
              color: isActive(item.href) ? "#10b981" : "var(--muted)",
              textDecoration: "none", padding: "4px 8px",
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
