import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="hero-gradient" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 32px", maxWidth: 1200, width: "100%", margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, #065f46, #10b981)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
          }}>
            🌳
          </div>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Family Tree</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/login" className="btn-secondary" style={{ padding: "10px 20px" }}>
            Sign In
          </Link>
          <Link href="/register" className="btn-primary" style={{ padding: "10px 20px" }}>
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "60px 24px", textAlign: "center",
      }}>
        <div className="animate-fade-in-up" style={{ maxWidth: 720 }}>
          <div className="animate-float" style={{ fontSize: 72, marginBottom: 24 }}>🌳</div>
          <h1 style={{
            fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 800,
            lineHeight: 1.1, marginBottom: 20,
            background: "linear-gradient(135deg, #065f46, #10b981, #047857)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Your Family Story,<br />Beautifully Mapped
          </h1>
          <p style={{
            fontSize: "clamp(16px, 2.5vw, 20px)", color: "var(--muted)",
            lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: "0 auto 40px",
          }}>
            Build an interactive family tree, share photos, track milestones, and invite
            family members — all in one beautiful, private space.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" className="btn-primary" style={{ padding: "16px 36px", fontSize: 16 }}>
              Start Your Tree →
            </Link>
            <Link href="/login" className="btn-secondary" style={{ padding: "16px 36px", fontSize: 16 }}>
              Sign In
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20, maxWidth: 900, width: "100%", marginTop: 80,
        }}>
          {[
            { icon: "🌳", title: "Interactive Tree", desc: "Zoom, pan, and explore your family connections visually" },
            { icon: "📷", title: "Photo Galleries", desc: "Preserve memories with photo albums for each member" },
            { icon: "📅", title: "Family Timeline", desc: "Track births, marriages, and milestones over generations" },
            { icon: "✉️", title: "Invite Family", desc: "Send email invites so everyone can contribute" },
            { icon: "📄", title: "Export to PDF", desc: "Download your family tree as a beautiful PDF" },
            { icon: "🔐", title: "Private & Secure", desc: "JWT authentication keeps your data safe and private" },
          ].map((f, i) => (
            <div
              key={i}
              className="glass-card animate-fade-in"
              style={{ padding: 24, textAlign: "left", animationDelay: `${0.1 * i}s` }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: "center", padding: "24px", fontSize: 13, color: "var(--muted)",
      }}>
        Built with ❤️ for families everywhere
      </footer>
    </div>
  );
}
