"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import FamilyTree from "@/app/components/FamilyTree";
import HierarchicalTree from "@/app/components/HierarchicalTree";
import ExportPDF from "@/app/components/ExportPDF";

export default function TreePage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"tree" | "bubbles">("tree");

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
            {viewMode === "tree"
              ? "Click a member to view details · Scroll to zoom · Drag to pan"
              : "Click a member to view details · Floating bubbles view"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* View mode toggle */}
          <div style={{
            display: "flex", background: "var(--card)", borderRadius: 10,
            padding: 3, border: "1px solid var(--card-border)",
          }}>
            <button
              onClick={() => setViewMode("tree")}
              style={{
                padding: "6px 14px", borderRadius: 8, border: "none", fontSize: 12,
                fontWeight: viewMode === "tree" ? 600 : 400, cursor: "pointer",
                background: viewMode === "tree" ? "var(--background)" : "transparent",
                color: viewMode === "tree" ? "#10b981" : "var(--muted)",
                fontFamily: "inherit",
                boxShadow: viewMode === "tree" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              🌳 Tree
            </button>
            <button
              onClick={() => setViewMode("bubbles")}
              style={{
                padding: "6px 14px", borderRadius: 8, border: "none", fontSize: 12,
                fontWeight: viewMode === "bubbles" ? 600 : 400, cursor: "pointer",
                background: viewMode === "bubbles" ? "var(--background)" : "transparent",
                color: viewMode === "bubbles" ? "#10b981" : "var(--muted)",
                fontFamily: "inherit",
                boxShadow: viewMode === "bubbles" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              🫧 Bubbles
            </button>
          </div>
          <ExportPDF />
          <button
            onClick={() => router.push("/dashboard/members/new")}
            className="btn-primary"
          >
            + Add Member
          </button>
        </div>
      </div>

      {/* Tree View */}
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
        {viewMode === "tree" ? (
          <HierarchicalTree
            onSelectMember={(id) => router.push(`/dashboard/members/${id}`)}
          />
        ) : (
          <FamilyTree
            onSelectMember={(id) => router.push(`/dashboard/members/${id}`)}
          />
        )}
      </div>
    </div>
  );
}
