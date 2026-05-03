"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PhotoGallery from "@/app/components/PhotoGallery";
import { useToast } from "@/app/components/Toast";

interface RelPerson { id: string; firstName: string; lastName: string }

interface Rel {
  id: string;
  type: string;
  to?: RelPerson;
  from?: RelPerson;
}

interface Member {
  id: string; firstName: string; lastName: string; gender: string;
  birthDate: string | null; deathDate: string | null;
  photoUrl: string | null; bio: string | null;
  photos: { id: string; url: string; caption: string | null; createdAt: string }[];
  events: { id: string; type: string; title: string; date: string; description: string | null }[];
  relFrom: Rel[];
  relTo: Rel[];
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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "", lastName: "", gender: "", birthDate: "", deathDate: "", bio: "",
  });

  // Relationship editing state
  const [showRelModal, setShowRelModal] = useState(false);
  const [allMembers, setAllMembers] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [newRelType, setNewRelType] = useState("PARENT");
  const [newRelTargetId, setNewRelTargetId] = useState("");
  const [newRelDirection, setNewRelDirection] = useState<"from" | "to">("from");
  const [addingRel, setAddingRel] = useState(false);

  const fetchMember = () => {
    fetch(`/api/members/${id}`).then(r => r.json()).then(d => {
      setMember(d.member);
      if (d.member) {
        setEditForm({
          firstName: d.member.firstName || "",
          lastName: d.member.lastName || "",
          gender: d.member.gender || "OTHER",
          birthDate: d.member.birthDate || "",
          deathDate: d.member.deathDate || "",
          bio: d.member.bio || "",
        });
      }
    }).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { fetchMember(); }, [id]);
  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setIsAdmin(d.user?.role === "ADMIN")).catch(() => {});
  }, []);

  const fetchAllMembers = () => {
    fetch("/api/members").then(r => r.json()).then(d => setAllMembers(d.members || [])).catch(console.error);
  };

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

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, photoUrl: member?.photoUrl }),
      });
      if (res.ok) {
        addToast("Profile updated successfully!", "success");
        setEditing(false);
        fetchMember();
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to update", "error");
      }
    } catch { addToast("Something went wrong", "error"); }
    setSaving(false);
  };

  const handleAddRelationship = async () => {
    if (!newRelTargetId) { addToast("Please select a family member", "error"); return; }
    setAddingRel(true);
    try {
      const body = newRelDirection === "from"
        ? { fromId: id, toId: newRelTargetId, type: newRelType }
        : { fromId: newRelTargetId, toId: id, type: newRelType };

      const res = await fetch("/api/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("Relationship added!", "success");
        fetchMember();
        setNewRelTargetId("");
      } else {
        addToast(data.error || "Failed to add relationship", "error");
      }
    } catch { addToast("Something went wrong", "error"); }
    setAddingRel(false);
  };

  const handleDeleteRelationship = async (relId: string) => {
    if (!confirm("Remove this relationship?")) return;
    try {
      const res = await fetch(`/api/relationships?id=${relId}`, { method: "DELETE" });
      if (res.ok) {
        addToast("Relationship removed", "success");
        fetchMember();
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to remove", "error");
      }
    } catch { addToast("Something went wrong", "error"); }
  };

  const updateField = (key: string, value: string) => setEditForm(prev => ({ ...prev, [key]: value }));

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div className="animate-float" style={{ fontSize: 48 }}>👤</div></div>;
  if (!member) return <div style={{ textAlign: "center", padding: 80, color: "var(--muted)" }}><p>Member not found</p><button onClick={() => router.back()} className="btn-secondary" style={{ marginTop: 16 }}>← Back</button></div>;

  const parents = member.relTo.filter(r => r.type === "PARENT").map(r => ({ ...r.from!, relId: r.id }));
  const children = member.relFrom.filter(r => r.type === "PARENT").map(r => ({ ...r.to!, relId: r.id }));
  const spouses = [
    ...member.relFrom.filter(r => r.type === "SPOUSE").map(r => ({ ...r.to!, relId: r.id })),
    ...member.relTo.filter(r => r.type === "SPOUSE").map(r => ({ ...r.from!, relId: r.id })),
  ];
  const siblings = [
    ...member.relFrom.filter(r => r.type === "SIBLING").map(r => ({ ...r.to!, relId: r.id })),
    ...member.relTo.filter(r => r.type === "SIBLING").map(r => ({ ...r.from!, relId: r.id })),
  ];
  const genderBadge = member.gender === "MALE" ? "badge-male" : member.gender === "FEMALE" ? "badge-female" : "badge-other";
  const genderLabel = member.gender === "MALE" ? "♂ Male" : member.gender === "FEMALE" ? "♀ Female" : "⚧ Other";

  // Direction helper text for the add-relationship form
  const getDirectionLabel = () => {
    if (newRelType === "PARENT" && newRelDirection === "from") return `${member.firstName} is PARENT of →`;
    if (newRelType === "PARENT" && newRelDirection === "to") return `← is PARENT of ${member.firstName}`;
    if (newRelType === "SPOUSE") return `${member.firstName} ↔ Spouse`;
    if (newRelType === "SIBLING") return `${member.firstName} ↔ Sibling`;
    return "";
  };

  const RelButton = ({ person, label, relId }: { person: { id: string; firstName: string; lastName: string }; label?: string; relId?: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
      <button onClick={() => router.push(`/dashboard/members/${person.id}`)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--background)", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, color: "var(--foreground)", fontFamily: "inherit", flex: 1 }}>
        <span className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{person.firstName.charAt(0)}</span>
        {person.firstName} {person.lastName} {label || ""}
      </button>
      {isAdmin && showRelModal && relId && (
        <button onClick={() => handleDeleteRelationship(relId)} style={{
          width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)",
          background: "rgba(239,68,68,0.08)", color: "#ef4444", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
          flexShrink: 0,
        }}>
          ✕
        </button>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 14, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>← Back</button>
        {isAdmin && (
          <div style={{ display: "flex", gap: 8 }}>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>
                ✏️ Edit Profile
              </button>
            ) : (
              <>
                <button onClick={() => { setEditing(false); fetchMember(); }} className="btn-secondary" style={{ fontSize: 13, padding: "8px 16px" }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>
                  {saving ? "Saving..." : "💾 Save Changes"}
                </button>
              </>
            )}
            <button onClick={handleDelete} disabled={deleting} style={{
              fontSize: 13, padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)",
              background: "rgba(239,68,68,0.08)", color: "#ef4444", cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
            }}>
              {deleting ? "..." : "🗑️"}
            </button>
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="glass-card" style={{ padding: 32, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Avatar with photo upload */}
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

          {/* Info / Edit form */}
          <div style={{ flex: 1, minWidth: 200 }}>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block", color: "var(--muted)" }}>First Name</label>
                    <input className="input-field" value={editForm.firstName} onChange={e => updateField("firstName", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block", color: "var(--muted)" }}>Last Name</label>
                    <input className="input-field" value={editForm.lastName} onChange={e => updateField("lastName", e.target.value)} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block", color: "var(--muted)" }}>Gender</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[{ v: "MALE", l: "♂ Male" }, { v: "FEMALE", l: "♀ Female" }, { v: "OTHER", l: "⚧ Other" }].map(g => (
                      <button key={g.v} type="button" onClick={() => updateField("gender", g.v)}
                        style={{
                          flex: 1, padding: "8px 12px", borderRadius: 8,
                          border: editForm.gender === g.v ? "2px solid #10b981" : "1px solid var(--card-border)",
                          background: editForm.gender === g.v ? "rgba(16,185,129,0.08)" : "var(--background)",
                          fontWeight: editForm.gender === g.v ? 600 : 400, fontSize: 13,
                          cursor: "pointer", color: "var(--foreground)", fontFamily: "inherit",
                        }}>
                        {g.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block", color: "var(--muted)" }}>Birth Date</label>
                    <input type="date" className="input-field" value={editForm.birthDate} onChange={e => updateField("birthDate", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block", color: "var(--muted)" }}>Death Date</label>
                    <input type="date" className="input-field" value={editForm.deathDate} onChange={e => updateField("deathDate", e.target.value)} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block", color: "var(--muted)" }}>Bio</label>
                  <textarea className="input-field" value={editForm.bio} onChange={e => updateField("bio", e.target.value)} rows={3} style={{ resize: "vertical" }} placeholder="Write something about this person..." />
                </div>
              </div>
            ) : (
              <>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{member.firstName} {member.lastName}</h1>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                  <span className={`badge ${genderBadge}`}>{genderLabel}</span>
                  {member.birthDate && <span className="badge badge-birth">🎂 Born {new Date(member.birthDate).toLocaleDateString()}</span>}
                  {member.deathDate && <span className="badge badge-death">✝ {new Date(member.deathDate).toLocaleDateString()}</span>}
                </div>
                {member.bio && <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>{member.bio}</p>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Relationships */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Relationships</h2>
          {isAdmin && (
            <button
              onClick={() => { setShowRelModal(!showRelModal); if (!showRelModal) fetchAllMembers(); }}
              className={showRelModal ? "btn-secondary" : "btn-primary"}
              style={{ fontSize: 12, padding: "6px 14px" }}
            >
              {showRelModal ? "Done" : "✏️ Edit Relationships"}
            </button>
          )}
        </div>

        {parents.length === 0 && children.length === 0 && spouses.length === 0 && siblings.length === 0 && !showRelModal && (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>No relationships added yet.</p>
        )}

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {parents.length > 0 && <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Parents</div>{parents.map(p => <RelButton key={p.relId} person={p} relId={p.relId} />)}</div>}
          {spouses.length > 0 && <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Spouse</div>{spouses.map(s => <RelButton key={s.relId} person={s} label="💍" relId={s.relId} />)}</div>}
          {children.length > 0 && <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Children</div>{children.map(c => <RelButton key={c.relId} person={c} relId={c.relId} />)}</div>}
          {siblings.length > 0 && <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Siblings</div>{siblings.map(s => <RelButton key={s.relId} person={s} label="👫" relId={s.relId} />)}</div>}
        </div>

        {/* Add Relationship Form (inline, shown when editing) */}
        {showRelModal && (
          <div style={{
            marginTop: 20, padding: 20, background: "var(--background)",
            borderRadius: 12, border: "1px solid var(--card-border)",
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>➕ Add New Relationship</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Relationship type */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block", color: "var(--muted)" }}>Type</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { v: "PARENT", l: "👨‍👦 Parent", emoji: "👨‍👦" },
                    { v: "SPOUSE", l: "💍 Spouse", emoji: "💍" },
                    { v: "SIBLING", l: "👫 Sibling", emoji: "👫" },
                  ].map(t => (
                    <button key={t.v} type="button" onClick={() => setNewRelType(t.v)}
                      style={{
                        flex: 1, padding: "8px 10px", borderRadius: 8,
                        border: newRelType === t.v ? "2px solid #10b981" : "1px solid var(--card-border)",
                        background: newRelType === t.v ? "rgba(16,185,129,0.08)" : "var(--card)",
                        fontWeight: newRelType === t.v ? 600 : 400, fontSize: 12,
                        cursor: "pointer", color: "var(--foreground)", fontFamily: "inherit",
                      }}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direction (only for PARENT) */}
              {newRelType === "PARENT" && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block", color: "var(--muted)" }}>Direction</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" onClick={() => setNewRelDirection("from")}
                      style={{
                        flex: 1, padding: "8px 10px", borderRadius: 8, fontSize: 12,
                        border: newRelDirection === "from" ? "2px solid #10b981" : "1px solid var(--card-border)",
                        background: newRelDirection === "from" ? "rgba(16,185,129,0.08)" : "var(--card)",
                        fontWeight: newRelDirection === "from" ? 600 : 400,
                        cursor: "pointer", color: "var(--foreground)", fontFamily: "inherit",
                      }}>
                      {member.firstName} is parent of...
                    </button>
                    <button type="button" onClick={() => setNewRelDirection("to")}
                      style={{
                        flex: 1, padding: "8px 10px", borderRadius: 8, fontSize: 12,
                        border: newRelDirection === "to" ? "2px solid #10b981" : "1px solid var(--card-border)",
                        background: newRelDirection === "to" ? "rgba(16,185,129,0.08)" : "var(--card)",
                        fontWeight: newRelDirection === "to" ? 600 : 400,
                        cursor: "pointer", color: "var(--foreground)", fontFamily: "inherit",
                      }}>
                      ... is parent of {member.firstName}
                    </button>
                  </div>
                </div>
              )}

              {/* Direction label */}
              <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", textAlign: "center" }}>
                {getDirectionLabel()}
              </div>

              {/* Select member */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block", color: "var(--muted)" }}>Select Member</label>
                <select className="input-field" value={newRelTargetId} onChange={e => setNewRelTargetId(e.target.value)}>
                  <option value="">Choose a family member...</option>
                  {allMembers.filter(m => m.id !== id).map(m => (
                    <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                  ))}
                </select>
              </div>

              <button onClick={handleAddRelationship} disabled={addingRel || !newRelTargetId} className="btn-primary" style={{ fontSize: 13, padding: "10px 20px" }}>
                {addingRel ? "Adding..." : "➕ Add Relationship"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
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
