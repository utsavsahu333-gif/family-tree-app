"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/Toast";

export default function NewMemberPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [members, setMembers] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [form, setForm] = useState({ firstName: "", lastName: "", gender: "MALE", birthDate: "", deathDate: "", bio: "", parentId: "", spouseId: "", photoUrl: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/members").then(r => r.json()).then(d => setMembers(d.members || [])).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { addToast(data.error || "Failed to add member", "error"); setLoading(false); return; }
      addToast(`${form.firstName} added to the family tree!`, "success");
      router.push("/dashboard/members");
    } catch { addToast("Something went wrong", "error"); setLoading(false); }
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="animate-fade-in" style={{ maxWidth: 600 }}>
      <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 14, cursor: "pointer", marginBottom: 16, padding: 0, fontFamily: "inherit" }}>← Back</button>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Add Family Member</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>Fill in the details to add a new member to your tree</p>

      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Photo upload */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", cursor: "pointer" }} onClick={() => document.getElementById("new-member-photo")?.click()}>
            <div className="avatar" style={{ width: 72, height: 72, fontSize: 28 }}>
              {form.photoUrl ? <img src={form.photoUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : "📷"}
            </div>
            <input id="new-member-photo" type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 2 * 1024 * 1024) { addToast("Photo must be under 2MB", "error"); return; }
              const reader = new FileReader();
              reader.onload = () => update("photoUrl", reader.result as string);
              reader.readAsDataURL(file);
            }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Profile Photo</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Click to upload (max 2MB). Shows in the family tree.</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>First Name *</label>
            <input className="input-field" placeholder="First name" value={form.firstName} onChange={e => update("firstName", e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Last Name *</label>
            <input className="input-field" placeholder="Last name" value={form.lastName} onChange={e => update("lastName", e.target.value)} required />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Gender *</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[{ v: "MALE", l: "♂ Male" }, { v: "FEMALE", l: "♀ Female" }, { v: "OTHER", l: "⚧ Other" }].map(g => (
              <button key={g.v} type="button" onClick={() => update("gender", g.v)}
                style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: form.gender === g.v ? "2px solid #10b981" : "1px solid var(--card-border)", background: form.gender === g.v ? "rgba(16,185,129,0.08)" : "var(--background)", fontWeight: form.gender === g.v ? 600 : 400, fontSize: 14, cursor: "pointer", color: "var(--foreground)", fontFamily: "inherit" }}>
                {g.l}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Birth Date</label>
            <input type="date" className="input-field" value={form.birthDate} onChange={e => update("birthDate", e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Death Date</label>
            <input type="date" className="input-field" value={form.deathDate} onChange={e => update("deathDate", e.target.value)} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Parent (optional)</label>
          <select className="input-field" value={form.parentId} onChange={e => update("parentId", e.target.value)}>
            <option value="">No parent selected</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Spouse (optional)</label>
          <select className="input-field" value={form.spouseId} onChange={e => update("spouseId", e.target.value)}>
            <option value="">No spouse selected</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Bio</label>
          <textarea className="input-field" placeholder="A few words about this person..." value={form.bio} onChange={e => update("bio", e.target.value)} rows={3} style={{ resize: "vertical" }} />
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "14px 24px" }}>
          {loading ? "Adding..." : "🌳 Add to Family Tree"}
        </button>
      </form>
    </div>
  );
}
