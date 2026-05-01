import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAuthUser } from "@/app/lib/auth";

interface TreeNode {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  deathDate: string | null;
  gender: string;
  photoUrl: string | null;
  children: TreeNode[];
  spouse: { id: string; firstName: string; lastName: string; photoUrl: string | null } | null;
}

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const members = await prisma.familyMember.findMany({
      include: {
        relFrom: true,
        relTo: true,
      },
    });

    const relationships = await prisma.relationship.findMany();

    // Build parent->children map
    const childrenMap = new Map<string, string[]>();
    const parentSet = new Set<string>();
    const spouseMap = new Map<string, string>();

    for (const rel of relationships) {
      if (rel.type === "PARENT") {
        if (!childrenMap.has(rel.fromId)) childrenMap.set(rel.fromId, []);
        childrenMap.get(rel.fromId)!.push(rel.toId);
        parentSet.add(rel.toId);
      }
      if (rel.type === "SPOUSE") {
        spouseMap.set(rel.fromId, rel.toId);
        spouseMap.set(rel.toId, rel.fromId);
      }
    }

    const memberMap = new Map(members.map((m) => [m.id, m]));

    // Find roots (members who are not children of anyone)
    const roots = members.filter((m) => !parentSet.has(m.id));

    function buildNode(id: string, visited: Set<string>): TreeNode | null {
      if (visited.has(id)) return null;
      visited.add(id);
      const m = memberMap.get(id);
      if (!m) return null;

      const childIds = childrenMap.get(id) || [];
      const children = childIds
        .map((cid) => buildNode(cid, visited))
        .filter(Boolean) as TreeNode[];

      const spouseId = spouseMap.get(id);
      const spouseMember = spouseId ? memberMap.get(spouseId) : null;

      return {
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        birthDate: m.birthDate,
        deathDate: m.deathDate,
        gender: m.gender,
        photoUrl: m.photoUrl,
        children,
        spouse: spouseMember
          ? {
              id: spouseMember.id,
              firstName: spouseMember.firstName,
              lastName: spouseMember.lastName,
              photoUrl: spouseMember.photoUrl,
            }
          : null,
      };
    }

    // Filter out spouses from roots (they'll be shown with their partner)
    const spouseIds = new Set(spouseMap.values());
    const filteredRoots = roots.filter(
      (r) => !spouseIds.has(r.id) || childrenMap.has(r.id)
    );

    const visited = new Set<string>();
    const tree = filteredRoots
      .map((r) => buildNode(r.id, visited))
      .filter(Boolean) as TreeNode[];

    return NextResponse.json({ tree, totalMembers: members.length });
  } catch (error) {
    console.error("Get tree error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
