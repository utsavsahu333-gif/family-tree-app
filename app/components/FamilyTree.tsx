"use client";
import { useEffect, useState, useCallback } from "react";

interface MemberData {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  photoUrl: string | null;
  birthDate: string | null;
}

interface Bubble {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  member: MemberData;
  hovered: boolean;
}

export default function FamilyTree({
  onSelectMember,
}: {
  onSelectMember?: (id: string) => void;
}) {
  const [members, setMembers] = useState<MemberData[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((d) => {
        setMembers(d.members || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Initialize bubbles when members load
  useEffect(() => {
    if (members.length === 0) return;
    const sizes = [80, 90, 100, 110, 70, 95, 85];
    const newBubbles: Bubble[] = members.map((m, i) => {
      const size = sizes[i % sizes.length];
      return {
        id: m.id,
        x: 100 + Math.random() * (containerSize.w - 200),
        y: 80 + Math.random() * (containerSize.h - 200),
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size,
        member: m,
        hovered: false,
      };
    });
    setBubbles(newBubbles);
  }, [members, containerSize]);

  // Animation loop
  useEffect(() => {
    if (bubbles.length === 0) return;

    const animate = () => {
      setBubbles((prev) =>
        prev.map((b) => {
          let { x, y, vx, vy, size } = b;
          const halfSize = size / 2;

          x += vx;
          y += vy;

          // Bounce off walls
          if (x - halfSize < 0) { x = halfSize; vx = Math.abs(vx); }
          if (x + halfSize > containerSize.w) { x = containerSize.w - halfSize; vx = -Math.abs(vx); }
          if (y - halfSize < 0) { y = halfSize; vy = Math.abs(vy); }
          if (y + halfSize > containerSize.h) { y = containerSize.h - halfSize; vy = -Math.abs(vy); }

          // Slow down when hovered
          if (b.id === hoveredId) {
            vx *= 0.92;
            vy *= 0.92;
          }

          return { ...b, x, y, vx, vy };
        })
      );
    };

    const interval = setInterval(animate, 16);
    return () => clearInterval(interval);
  }, [bubbles.length, containerSize, hoveredId]);

  // Track container size
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>
        <div className="animate-float" style={{ fontSize: 48 }}>🌳</div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100%", gap: 16, color: "var(--muted)",
      }}>
        <div style={{ fontSize: 64, opacity: 0.5 }}>🌱</div>
        <p style={{ fontSize: 18, fontWeight: 600 }}>Your family tree is empty</p>
        <p style={{ fontSize: 14 }}>Add your first family member to get started</p>
      </div>
    );
  }

  const genderGradient = (gender: string) => {
    if (gender === "MALE") return "linear-gradient(135deg, #3b82f6, #1d4ed8)";
    if (gender === "FEMALE") return "linear-gradient(135deg, #ec4899, #be185d)";
    return "linear-gradient(135deg, #a855f7, #7c3aed)";
  };

  const genderGlow = (gender: string) => {
    if (gender === "MALE") return "0 0 20px rgba(59,130,246,0.4)";
    if (gender === "FEMALE") return "0 0 20px rgba(236,72,153,0.4)";
    return "0 0 20px rgba(168,85,247,0.4)";
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        borderRadius: 16,
        background: "radial-gradient(ellipse at center, var(--card) 0%, var(--background) 70%)",
      }}
    >
      {/* Decorative background dots */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none" }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: 4, height: 4, borderRadius: "50%",
            background: "var(--foreground)",
          }} />
        ))}
      </div>

      {/* Member count */}
      <div style={{
        position: "absolute", bottom: 16, left: 16, zIndex: 10,
        fontSize: 12, color: "var(--muted)", background: "var(--card)",
        padding: "6px 12px", borderRadius: 8, border: "1px solid var(--card-border)",
        backdropFilter: "blur(8px)",
      }}>
        {members.length} member{members.length !== 1 ? "s" : ""} · Click to view profile
      </div>

      {/* Floating bubbles */}
      {bubbles.map((b) => {
        const isHovered = hoveredId === b.id;
        const scale = isHovered ? 1.15 : 1;
        const initials = b.member.firstName.charAt(0).toUpperCase();

        return (
          <div
            key={b.id}
            onClick={() => onSelectMember?.(b.id)}
            onMouseEnter={() => setHoveredId(b.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              position: "absolute",
              left: b.x - b.size / 2,
              top: b.y - b.size / 2,
              width: b.size,
              height: b.size,
              borderRadius: "50%",
              cursor: "pointer",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              transform: `scale(${scale})`,
              zIndex: isHovered ? 20 : 5,
            }}
          >
            {/* Outer ring */}
            <div style={{
              position: "absolute", inset: -3,
              borderRadius: "50%",
              background: genderGradient(b.member.gender),
              opacity: isHovered ? 1 : 0.6,
              transition: "opacity 0.3s ease",
            }} />

            {/* Photo / initials circle */}
            <div style={{
              position: "absolute", inset: 3,
              borderRadius: "50%",
              overflow: "hidden",
              background: b.member.photoUrl ? "none" : "var(--card)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: isHovered ? genderGlow(b.member.gender) : "0 4px 15px rgba(0,0,0,0.15)",
              transition: "box-shadow 0.3s ease",
            }}>
              {b.member.photoUrl ? (
                <img
                  src={b.member.photoUrl}
                  alt={b.member.firstName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  draggable={false}
                />
              ) : (
                <span style={{
                  fontSize: b.size * 0.38,
                  fontWeight: 800,
                  color: "var(--muted)",
                  userSelect: "none",
                }}>
                  {initials}
                </span>
              )}
            </div>

            {/* Name tooltip on hover */}
            {isHovered && (
              <div style={{
                position: "absolute",
                bottom: -32,
                left: "50%",
                transform: "translateX(-50%)",
                background: "var(--card)",
                border: "1px solid var(--card-border)",
                borderRadius: 8,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                color: "var(--foreground)",
                animation: "fadeIn 0.2s ease",
              }}>
                {b.member.firstName} {b.member.lastName}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
