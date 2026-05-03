"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";

interface TreeNode {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  deathDate: string | null;
  gender: string;
  photoUrl: string | null;
  children: TreeNode[];
  spouse: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  } | null;
}

interface LayoutNode {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  photoUrl: string | null;
  birthDate: string | null;
  x: number;
  y: number;
  spouseId?: string;
  spouseFirstName?: string;
  spouseLastName?: string;
  spousePhotoUrl?: string | null;
  childIds: string[];
  level: number;
}

const NODE_W = 150;
const NODE_H = 160;
const COUPLE_GAP = 20;
const COUPLE_W = NODE_W * 2 + COUPLE_GAP;
const LEVEL_GAP = 100;
const SIBLING_GAP = 40;
const PHOTO_R = 38;

export default function HierarchicalTree({
  onSelectMember,
}: {
  onSelectMember?: (id: string) => void;
}) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & zoom state
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1200, h: 800 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetch("/api/tree")
      .then((r) => r.json())
      .then((d) => {
        setTree(d.tree || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Layout algorithm
  useEffect(() => {
    if (tree.length === 0) return;

    const nodes: LayoutNode[] = [];

    function getSubtreeWidth(node: TreeNode): number {
      if (node.children.length === 0) {
        return node.spouse ? COUPLE_W : NODE_W;
      }
      const childrenWidth = node.children.reduce(
        (sum: number, child: TreeNode) => sum + getSubtreeWidth(child) + SIBLING_GAP,
        -SIBLING_GAP
      );
      const nodeWidth = node.spouse ? COUPLE_W : NODE_W;
      return Math.max(nodeWidth, childrenWidth);
    }

    function layoutNode(node: TreeNode, x: number, y: number, level: number) {
      const subtreeWidth = getSubtreeWidth(node);
      const nodeX = x + subtreeWidth / 2;

      const layoutEntry: LayoutNode = {
        id: node.id,
        firstName: node.firstName,
        lastName: node.lastName,
        gender: node.gender,
        photoUrl: node.photoUrl,
        birthDate: node.birthDate,
        x: nodeX,
        y,
        childIds: node.children.map((c) => c.id),
        level,
      };

      if (node.spouse) {
        layoutEntry.spouseId = node.spouse.id;
        layoutEntry.spouseFirstName = node.spouse.firstName;
        layoutEntry.spouseLastName = node.spouse.lastName;
        layoutEntry.spousePhotoUrl = node.spouse.photoUrl;
      }

      nodes.push(layoutEntry);

      // Layout children
      if (node.children.length > 0) {
        const childrenTotalWidth = node.children.reduce(
          (sum, child) => sum + getSubtreeWidth(child) + SIBLING_GAP,
          -SIBLING_GAP
        );
        let childX = nodeX - childrenTotalWidth / 2;
        const childY = y + NODE_H + LEVEL_GAP;

        for (const child of node.children) {
          const childSubW = getSubtreeWidth(child);
          layoutNode(child, childX, childY, level + 1);
          childX += childSubW + SIBLING_GAP;
        }
      }
    }

    // Layout all root nodes side by side
    let startX = 100;

    for (const root of tree) {
      const rootWidth = getSubtreeWidth(root);
      layoutNode(root, startX, 80, 0);
      startX += rootWidth + SIBLING_GAP * 2;
    }

    setLayoutNodes(nodes);

    // Auto-fit viewBox
    if (nodes.length > 0) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const n of nodes) {
        const leftEdge = n.spouseId ? n.x - COUPLE_W / 2 - 20 : n.x - NODE_W / 2 - 20;
        const rightEdge = n.spouseId ? n.x + COUPLE_W / 2 + 20 : n.x + NODE_W / 2 + 20;
        minX = Math.min(minX, leftEdge);
        maxX = Math.max(maxX, rightEdge);
        minY = Math.min(minY, n.y - 40);
        maxY = Math.max(maxY, n.y + NODE_H + 40);
      }
      const padding = 60;
      setViewBox({
        x: minX - padding,
        y: minY - padding,
        w: maxX - minX + padding * 2,
        h: maxY - minY + padding * 2,
      });
    }
  }, [tree]);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !svgRef.current) return;
      const svg = svgRef.current;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const dx = (e.clientX - panStart.x) / ctm.a;
      const dy = (e.clientY - panStart.y) / ctm.d;
      setViewBox((prev) => ({
        ...prev,
        x: prev.x - dx,
        y: prev.y - dy,
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    },
    [isPanning, panStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Zoom handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox((prev) => {
      const newW = prev.w * scaleFactor;
      const newH = prev.h * scaleFactor;
      const cx = prev.x + prev.w / 2;
      const cy = prev.y + prev.h / 2;
      return {
        x: cx - newW / 2,
        y: cy - newH / 2,
        w: newW,
        h: newH,
      };
    });
  }, []);

  // Helper: render a single person circle with name
  const renderPerson = (
    id: string,
    firstName: string,
    lastName: string,
    gender: string,
    photoUrl: string | null,
    cx: number,
    cy: number,
    relationLabel?: string
  ) => {
    const isHovered = hoveredId === id;
    const ringColor =
      gender === "MALE"
        ? "#3b82f6"
        : gender === "FEMALE"
        ? "#ec4899"
        : "#a855f7";

    return (
      <g
        key={id}
        className="tree-person-node"
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectMember?.(id);
        }}
        onMouseEnter={() => setHoveredId(id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        {/* Outer ring */}
        <circle
          cx={cx}
          cy={cy}
          r={PHOTO_R + 3}
          fill="none"
          stroke={ringColor}
          strokeWidth={isHovered ? 3 : 2}
          opacity={isHovered ? 1 : 0.5}
          style={{ transition: "all 0.3s ease" }}
        />

        {/* Photo circle */}
        <clipPath id={`clip-${id}`}>
          <circle cx={cx} cy={cy} r={PHOTO_R} />
        </clipPath>

        {photoUrl ? (
          <image
            href={photoUrl}
            x={cx - PHOTO_R}
            y={cy - PHOTO_R}
            width={PHOTO_R * 2}
            height={PHOTO_R * 2}
            clipPath={`url(#clip-${id})`}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <>
            <circle cx={cx} cy={cy} r={PHOTO_R} fill="var(--card)" stroke="var(--card-border)" strokeWidth={1} />
            <text
              x={cx}
              y={cy + 6}
              textAnchor="middle"
              fill="var(--muted)"
              fontSize={22}
              fontWeight={700}
              fontFamily="var(--font-sans)"
            >
              {firstName.charAt(0).toUpperCase()}
            </text>
          </>
        )}

        {/* Hover glow */}
        {isHovered && (
          <circle
            cx={cx}
            cy={cy}
            r={PHOTO_R + 8}
            fill="none"
            stroke={ringColor}
            strokeWidth={1}
            opacity={0.3}
          />
        )}

        {/* Name */}
        <text
          x={cx}
          y={cy + PHOTO_R + 18}
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize={12}
          fontWeight={700}
          fontFamily="var(--font-sans)"
        >
          {firstName} {lastName}
        </text>

        {/* Relationship label */}
        {relationLabel && (
          <text
            x={cx}
            y={cy + PHOTO_R + 32}
            textAnchor="middle"
            fill="var(--muted)"
            fontSize={10}
            fontStyle="italic"
            fontFamily="var(--font-sans)"
          >
            {relationLabel}
          </text>
        )}
      </g>
    );
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "var(--muted)",
        }}
      >
        <div className="animate-float" style={{ fontSize: 48 }}>
          🌳
        </div>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 16,
          color: "var(--muted)",
        }}
      >
        <div style={{ fontSize: 64, opacity: 0.5 }}>🌱</div>
        <p style={{ fontSize: 18, fontWeight: 600 }}>Your family tree is empty</p>
        <p style={{ fontSize: 14 }}>
          Add family members and set relationships to see the tree
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        borderRadius: 16,
        background:
          "radial-gradient(ellipse at center, var(--card) 0%, var(--background) 70%)",
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "var(--foreground)",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            letterSpacing: 1,
            opacity: 0.6,
          }}
        >
          Our Family Tree
        </h2>
      </div>

      {/* Member count */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          zIndex: 10,
          fontSize: 12,
          color: "var(--muted)",
          background: "var(--card)",
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid var(--card-border)",
          backdropFilter: "blur(8px)",
        }}
      >
        {layoutNodes.length} member
        {layoutNodes.length !== 1 ? "s" : ""} · Click to view profile · Scroll
        to zoom · Drag to pan
      </div>

      {/* Zoom controls */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          zIndex: 10,
          display: "flex",
          gap: 4,
        }}
      >
        <button
          onClick={() =>
            setViewBox((prev) => ({
              x: prev.x + prev.w * 0.05,
              y: prev.y + prev.h * 0.05,
              w: prev.w * 0.9,
              h: prev.h * 0.9,
            }))
          }
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "1px solid var(--card-border)",
            background: "var(--card)",
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--foreground)",
          }}
        >
          +
        </button>
        <button
          onClick={() =>
            setViewBox((prev) => ({
              x: prev.x - prev.w * 0.05,
              y: prev.y - prev.h * 0.05,
              w: prev.w * 1.1,
              h: prev.h * 1.1,
            }))
          }
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "1px solid var(--card-border)",
            background: "var(--card)",
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--foreground)",
          }}
        >
          −
        </button>
      </div>

      {/* SVG Tree */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        style={{
          cursor: isPanning ? "grabbing" : "grab",
          userSelect: "none",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          {/* Decorative pattern */}
          <pattern
            id="tree-bg-dots"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="1" fill="var(--muted)" opacity="0.08" />
          </pattern>
        </defs>

        <rect
          x={viewBox.x}
          y={viewBox.y}
          width={viewBox.w}
          height={viewBox.h}
          fill="url(#tree-bg-dots)"
        />

        {/* Connector lines */}
        {layoutNodes.map((node) => {
          const lines: React.ReactElement[] = [];

          // Spouse connector (horizontal line between couple)
          if (node.spouseId) {
            lines.push(
              <line
                key={`spouse-${node.id}`}
                x1={node.x - COUPLE_GAP / 2 - 5}
                y1={node.y + PHOTO_R}
                x2={node.x + COUPLE_GAP / 2 + 5}
                y2={node.y + PHOTO_R}
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="6,3"
                opacity={0.5}
              />
            );
            // Heart / ring symbol in the middle
            lines.push(
              <text
                key={`heart-${node.id}`}
                x={node.x}
                y={node.y + PHOTO_R + 5}
                textAnchor="middle"
                fontSize={12}
                fill="#f59e0b"
              >
                💍
              </text>
            );
          }

          // Parent-to-children connectors
          if (node.childIds.length > 0) {
            const parentBottomY = node.y + NODE_H;
            const childY = node.y + NODE_H + LEVEL_GAP;

            // Get child positions
            const childNodes = node.childIds
              .map((cid) => layoutNodes.find((n) => n.id === cid))
              .filter(Boolean) as LayoutNode[];

            if (childNodes.length > 0) {
              // Vertical line from parent down to junction
              const junctionY = parentBottomY + LEVEL_GAP / 2;
              lines.push(
                <line
                  key={`pdown-${node.id}`}
                  x1={node.x}
                  y1={parentBottomY}
                  x2={node.x}
                  y2={junctionY}
                  className="tree-connector"
                  stroke="#10b981"
                  strokeWidth={2}
                  opacity={0.4}
                />
              );

              if (childNodes.length === 1) {
                // Single child — straight vertical line
                lines.push(
                  <line
                    key={`cline-${node.id}-0`}
                    x1={childNodes[0].x}
                    y1={junctionY}
                    x2={childNodes[0].x}
                    y2={childY}
                    stroke="#10b981"
                    strokeWidth={2}
                    opacity={0.4}
                  />
                );
              } else {
                // Multiple children — horizontal bar + verticals
                const leftChild = childNodes[0];
                const rightChild = childNodes[childNodes.length - 1];

                lines.push(
                  <line
                    key={`hbar-${node.id}`}
                    x1={leftChild.x}
                    y1={junctionY}
                    x2={rightChild.x}
                    y2={junctionY}
                    stroke="#10b981"
                    strokeWidth={2}
                    opacity={0.4}
                  />
                );

                for (const child of childNodes) {
                  lines.push(
                    <line
                      key={`cline-${node.id}-${child.id}`}
                      x1={child.x}
                      y1={junctionY}
                      x2={child.x}
                      y2={childY}
                      stroke="#10b981"
                      strokeWidth={2}
                      opacity={0.4}
                    />
                  );
                }
              }
            }
          }

          return <g key={`lines-${node.id}`}>{lines}</g>;
        })}

        {/* Render person nodes */}
        {layoutNodes.map((node) => {
          const elements: React.ReactElement[] = [];

          if (node.spouseId) {
            // Couple layout — two circles side by side
            const personLeftX = node.x - COUPLE_GAP / 2 - PHOTO_R - 3;
            const personRightX = node.x + COUPLE_GAP / 2 + PHOTO_R + 3;
            const cy = node.y + PHOTO_R;

            elements.push(
              renderPerson(
                node.id,
                node.firstName,
                node.lastName,
                node.gender,
                node.photoUrl,
                personLeftX,
                cy
              )
            );
            elements.push(
              renderPerson(
                node.spouseId,
                node.spouseFirstName || "",
                node.spouseLastName || "",
                node.gender === "MALE" ? "FEMALE" : "MALE",
                node.spousePhotoUrl || null,
                personRightX,
                cy
              )
            );
          } else {
            // Single person
            elements.push(
              renderPerson(
                node.id,
                node.firstName,
                node.lastName,
                node.gender,
                node.photoUrl,
                node.x,
                node.y + PHOTO_R
              )
            );
          }

          return <g key={`node-${node.id}`}>{elements}</g>;
        })}
      </svg>
    </div>
  );
}
