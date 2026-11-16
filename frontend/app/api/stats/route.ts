import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const [totalDemandes, totalComptes, totalConversations, demandesParService] = await Promise.all([
    prisma.demande.count(),
    prisma.compte.count(),
    prisma.conversationLog.count(),
    prisma.demande.groupBy({ by: ["service"], _count: true }),
  ]);

  const [convosParLangue, convosParIntent] = await Promise.all([
    prisma.conversationLog.groupBy({ by: ["langue"], _count: { id: true } }),
    prisma.conversationLog.groupBy({ by: ["intent"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 8 }),
  ]);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentConvos = await prisma.conversationLog.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true },
  });
  const convosParJour: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    convosParJour[d.toISOString().split("T")[0]] = 0;
  }
  for (const c of recentConvos) {
    const jour = c.createdAt.toISOString().split("T")[0];
    if (convosParJour[jour] !== undefined) convosParJour[jour]++;
  }

  return NextResponse.json({
    totalDemandes,
    totalConversations,
    totalComptes,
    demandesParService: demandesParService.map((g) => ({ service: g.service, count: g._count })),
    convosParLangue: convosParLangue.map((g) => ({ langue: g.langue, count: g._count.id })),
    convosParIntent: convosParIntent.map((g) => ({ intent: g.intent || "inconnu", count: g._count.id })),
    convosParJour: Object.entries(convosParJour).map(([jour, count]) => ({ jour, count })),
  });
}
