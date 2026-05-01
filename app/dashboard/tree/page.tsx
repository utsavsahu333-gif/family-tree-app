"use client";
import { useRouter } from "next/navigation";
import FamilyTree from "@/app/components/FamilyTree";
import ExportPDF from "@/app/components/ExportPDF";

export default function TreePage() {
  const router = useRouter();

  return (
    <div className="animate-fade-in" style={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Family Tree</h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            Click a member to view details · Scroll to zoom · Drag to pan
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ExportPDF />
          <button
            onClick={() => router.push("/dashboard/members/new")}
            className="btn-primary"
          >
            + Add Member
          </button>
        </div>
      </div>

      {/* Tree */}
      <div
        data-tree-container
        style={{
          flex: 1,
          borderRadius: 16,
          border: "1px solid var(--card-border)",
          overflow: "hidden",
          background: "var(--background)",
        }}
      >
        <FamilyTree
          onSelectMember={(id) => router.push(`/dashboard/members/${id}`)}
        />
      </div>
    </div>
  );
}
