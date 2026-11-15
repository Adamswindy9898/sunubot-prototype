import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const compteId = searchParams.get("compteId");
  const limit = parseInt(searchParams.get("limit") || "50");
  const langue = searchParams.get("langue");

  const where: Record<string, unknown> = {};
  if (compteId) where.compteId = compteId;
  if (langue) where.langue = langue;

  const conversations = await prisma.conversationLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 200),
  });

  const stats = await prisma.conversationLog.groupBy({
    by: ["langue"],
    where: compteId ? { compteId } : {},
    _count: { id: true },
  });

  const intentStats = await prisma.conversationLog.groupBy({
    by: ["intent"],
    where: compteId ? { compteId } : {},
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 8,
  });

  return NextResponse.json({
    conversations,
    stats: {
      total: conversations.length,
      par_langue: stats.map((s) => ({ langue: s.langue, count: s._count.id })),
      par_intent: intentStats.map((s) => ({
        intent: s.intent || "inconnu",
        count: s._count.id,
      })),
    },
  });
}
