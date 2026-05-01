"use client";

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  date: string;
  member: { id: string; firstName: string; lastName: string; photoUrl?: string | null };
}

export default function TimelineView({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📅</div>
        <p style={{ fontSize: 16, fontWeight: 600 }}>No events yet</p>
        <p style={{ fontSize: 14 }}>Add family events to see them on the timeline</p>
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  const typeIcon = (type: string) => {
    switch (type) {
      case "BIRTH": return "🎂";
      case "MARRIAGE": return "💍";
      case "DEATH": return "🕊️";
      default: return "📌";
    }
  };

  const typeBadge = (type: string) => {
    switch (type) {
      case "BIRTH": return "badge-birth";
      case "MARRIAGE": return "badge-marriage";
      case "DEATH": return "badge-death";
      default: return "";
    }
  };

  return (
    <div style={{ position: "relative", padding: "20px 0" }}>
      {/* Central line */}
      <div style={{
        position: "absolute", left: 24, top: 0, bottom: 0, width: 2,
        background: "linear-gradient(to bottom, #10b981, rgba(16, 185, 129, 0.1))",
      }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {sorted.map((event, i) => (
          <div
            key={event.id}
            className="animate-fade-in"
            style={{
              display: "flex", gap: 20, paddingLeft: 48,
              animationDelay: `${i * 0.1}s`, position: "relative",
            }}
          >
            {/* Dot */}
            <div style={{
              position: "absolute", left: 16, top: 20,
              width: 18, height: 18, borderRadius: "50%",
              border: `3px solid ${event.type === "BIRTH" ? "#10b981" : event.type === "MARRIAGE" ? "#f59e0b" : "#94a3b8"}`,
              background: "var(--card)", zIndex: 2,
            }} />

            {/* Card */}
            <div className="glass-card" style={{ flex: 1, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{typeIcon(event.type)}</span>
                <span className={`badge ${typeBadge(event.type)}`}>
                  {event.type}
                </span>
                <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: "auto" }}>
                  {new Date(event.date).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                {event.title}
              </h3>
              {event.description && (
                <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 8 }}>
                  {event.description}
                </p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="avatar" style={{ width: 24, height: 24, fontSize: 11 }}>
                  {event.member.firstName.charAt(0)}
                </div>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>
                  {event.member.firstName} {event.member.lastName}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
