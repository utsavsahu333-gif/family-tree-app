"use client";

interface MemberCardProps {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthDate?: string | null;
  deathDate?: string | null;
  photoUrl?: string | null;
  bio?: string | null;
  onClick?: () => void;
}

export default function MemberCard({
  firstName, lastName, gender, birthDate, deathDate, photoUrl, onClick,
}: MemberCardProps) {
  const initial = firstName.charAt(0).toUpperCase();
  const genderBadge = gender === "MALE" ? "badge-male" : gender === "FEMALE" ? "badge-female" : "badge-other";
  const genderLabel = gender === "MALE" ? "♂ Male" : gender === "FEMALE" ? "♀ Female" : "⚧ Other";

  return (
    <div
      className="glass-card animate-fade-in"
      onClick={onClick}
      style={{ padding: 20, cursor: onClick ? "pointer" : "default" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div className="avatar" style={{ width: 52, height: 52, fontSize: 20 }}>
          {photoUrl ? (
            <img src={photoUrl} alt={firstName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
          ) : (
            initial
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
            {firstName} {lastName}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className={`badge ${genderBadge}`}>{genderLabel}</span>
            {birthDate && (
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                🎂 {new Date(birthDate).getFullYear()}
              </span>
            )}
            {deathDate && (
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                ✝ {new Date(deathDate).getFullYear()}
              </span>
            )}
          </div>
        </div>
        {onClick && (
          <span style={{ color: "var(--muted)", fontSize: 20 }}>→</span>
        )}
      </div>
    </div>
  );
}
