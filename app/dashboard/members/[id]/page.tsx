"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PhotoGallery from "@/app/components/PhotoGallery";
import { useToast } from "@/app/components/Toast";

interface Member {
  id: string; firstName: string; lastName: string; gender: string;
  birthDate: string | null; deathDate: string | null;
  photoUrl: string | null; bio: string | null;
  photos: { id: string; url: string; caption: string | null; createdAt: string }[];
  events: { id: string; type: string; title: string; date: string; description: string | null }[];
  relFrom: { type: string; to: { id: string; firstName: string; lastName: string } }[];
  relTo: { type: string; from: { id: string; firstName: string; lastName: string } }[];
}

export default function MemberDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"details" | "photos" | "events">("details");
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchMember = () => {
    fetch(`/api/members/${id}`).then(r => r.json()).then(d => setMember(d.member)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { fetchMember(); }, [id]);
  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setIsAdmin(d.user?.role === "ADMIN")).catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${member?.firstName} ${member?.lastName} from the family tree? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast(`${member?.firstName} removed from the tree`, "success");
        router.push("/dashboard/members");
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to delete", "error");
      }
    } catch { addToast("Something went wrong", "error"); }
    setDeleting(false);
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div className="animate-float" style={{ fontSize: 48 }}>👤</div></div>;
  if (!member) return <div style={{ textAlign: "center", padding: 80, color: "var(--muted)" }}><p>Member not found</p><button onClick={() => router.back()} className="btn-secondary" style={{ marginTop: 16 }}>← Back</button></div>;

  const parents = member.relTo.filter(r => r.type === "PARENT").map(r => r.from);
  const children = member.relFrom.filter(r => r.type === "PARENT").map(r => r.to);
  const spouses = [...member.relFrom.filter(r => r.type === "SPOUSE").map(r => r.to), ...member.relTo.filter(r => r.type === "SPOUSE").map(r => r.from)];
  const genderBadge = member.gender === "MALE" ? "badge-male" : member.gender === "FEMALE" ? "badge-female" : "badge-other";
  const genderLabel = member.gender === "MALE" ? "♂ Male" : member.gender === "FEMALE" ? "♀ Female" : "⚧ Other";

  const RelButton = ({ person, label }: { person: { id: string; firstName: string; lastName: string }; label?: string }) => (
    <button onClick={() => router.push(`/dashboard/members/${person.id}`)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--background)", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, color: "var(--foreground)", fontFamily: "inherit", marginBottom: 4, width: "100%" }}>
      <span className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{person.firstName.charAt(0)}</span>
      {person.firstName} {person.lastName} {label || ""}
    </button>
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 14, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>← Back</button>
        {isAdmin && (
          <button onClick={handleDelete} disabled={deleting} className="btn-danger" style={{ fontSize: 13, padding: "8px 16px" }}>
            {deleting ? "Removing..." : "🗑️ Delete Member"}
          </button>
        )}
      </div>

      <div className="glass-card" style={{ padding: 32, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ position: "relative", cursor: "pointer" }} onClick={() => document.getElementById("profile-photo-input")?.click()}>
            <div className="avatar" style={{ width: 100, height: 100, fontSize: 36, borderRadius: "50%" }}>
              {member.photoUrl ? <img src={member.photoUrl} alt={member.firstName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : member.firstName.charAt(0)}
            </div>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center",
              justifyContent: "center", opacity: 0, transition: "opacity 0.2s",
              color: "#fff", fontSize: 13, fontWeight: 600,
            }} onMouseEnter={e => (e.currentTarget.style.opacity = "1")} onMouseLeave={e => (e.currentTarget.style.opacity = "0")}>
              📷 Edit
            </div>
            <input id="profile-photo-input" type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 2 * 1024 * 1024) { addToast("Photo must be under 2MB", "error"); return; }
              const reader = new FileReader();
              reader.onload = async () => {
                const photoUrl = reader.result as string;
                const res = await fetch(`/api/members/${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...member, photoUrl }),
                });
                if (res.ok) { addToast("Profile photo updated!", "success"); fetchMember(); }
                else addToast("Failed to update photo", "error");
              };
              reader.readAsDataURL(file);
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{member.firstName} {member.lastName}</h1>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <span className={`badge ${genderBadge}`}>{genderLabel}</span>
              {member.birthDate && <span className="badge badge-birth">🎂 Born {new Date(member.birthDate).toLocaleDateString()}</span>}
              {member.deathDate && <span className="badge badge-death">✝ {new Date(member.deathDate).toLocaleDateString()}</span>}
            </div>
            {member.bio && <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>{member.bio}</p>}
          </div>
        </div>
      </div>

      {(parents.length > 0 || children.length > 0 || spouses.length > 0) && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Relationships</h2>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {parents.length > 0 && <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Parents</div>{parents.map(p => <RelButton key={p.id} person={p} />)}</div>}
            {spouses.length > 0 && <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Spouse</div>{spouses.map(s => <RelButton key={s.id} person={s} label="💍" />)}</div>}
            {children.length > 0 && <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Children</div>{children.map(c => <RelButton key={c.id} person={c} />)}</div>}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--card)", borderRadius: 10, padding: 4, border: "1px solid var(--card-border)", width: "fit-content" }}>
        {(["details", "photos", "events"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: tab === t ? "var(--background)" : "transparent", fontWeight: tab === t ? 600 : 400, fontSize: 14, cursor: "pointer", color: "var(--foreground)", fontFamily: "inherit", boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            {t === "details" ? "📋 Details" : t === "photos" ? `📷 Photos (${member.photos.length})` : `📅 Events (${member.events.length})`}
          </button>
        ))}
      </div>

      {tab === "details" && <div className="glass-card" style={{ padding: 24 }}><h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>About</h3><p style={{ color: "var(--muted)", lineHeight: 1.8 }}>{member.bio || "No bio added yet."}</p></div>}
      {tab === "photos" && <PhotoGallery photos={member.photos} memberId={member.id} onUpload={fetchMember} />}
      {tab === "events" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {member.events.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>No events yet</div> :
            member.events.map(event => (
              <div key={event.id} className="glass-card" style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{event.type === "BIRTH" ? "🎂" : event.type === "MARRIAGE" ? "💍" : event.type === "DEATH" ? "🕊️" : "📌"}</span>
                  <div><div style={{ fontWeight: 600, fontSize: 14 }}>{event.title}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(event.date).toLocaleDateString()}{event.description && ` · ${event.description}`}</div></div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
