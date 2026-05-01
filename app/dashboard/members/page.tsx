"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MemberCard from "@/app/components/MemberCard";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string | null;
  deathDate: string | null;
  photoUrl: string | null;
  bio: string | null;
}

export default function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((d) => setMembers(d.members || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = members.filter((m) =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 24, flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Family Members</h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            {members.length} member{members.length !== 1 ? "s" : ""} in your family tree
          </p>
        </div>
        <button onClick={() => router.push("/dashboard/members/new")} className="btn-primary">
          + Add Member
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        className="input-field"
        placeholder="🔍 Search members..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 20, maxWidth: 400 }}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
          <div className="animate-float" style={{ fontSize: 40 }}>👥</div>
          <p style={{ marginTop: 16 }}>Loading members...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
          <div style={{ fontSize: 48, opacity: 0.5, marginBottom: 16 }}>
            {search ? "🔍" : "👥"}
          </div>
          <p style={{ fontSize: 16, fontWeight: 600 }}>
            {search ? "No members found" : "No family members yet"}
          </p>
          <p style={{ fontSize: 14, marginBottom: 20 }}>
            {search ? "Try a different search term" : "Add your first family member to get started"}
          </p>
          {!search && (
            <button onClick={() => router.push("/dashboard/members/new")} className="btn-primary">
              + Add First Member
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
        }}>
          {filtered.map((m, i) => (
            <div key={m.id} style={{ animationDelay: `${i * 0.05}s` }}>
              <MemberCard
                {...m}
                onClick={() => router.push(`/dashboard/members/${m.id}`)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
