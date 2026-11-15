import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin2024";

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("x-admin-token");
  return auth === ADMIN_PASS;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const section = req.nextUrl.searchParams.get("section") || "stats";

  if (section === "stats") {
    const [totalDemandes, totalComptes, totalCitoyens, totalConversations, demandesParStatut, demandesParService] = await Promise.all([
      prisma.demande.count(),
      prisma.compte.count(),
      prisma.citoyen.count(),
      prisma.conversationLog.count(),
      prisma.demande.groupBy({ by: ["statut"], _count: true }),
      prisma.demande.groupBy({ by: ["service"], _count: true }),
    ]);

    const serviceRecordCount = await prisma.serviceRecord.count();

    const [convosParLangue, convosParIntent] = await Promise.all([
      prisma.conversationLog.groupBy({ by: ["langue"], _count: { id: true } }),
      prisma.conversationLog.groupBy({ by: ["intent"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 8 }),
    ]);

    // Conversations des 7 derniers jours
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
      totalComptes,
      totalCitoyens,
      totalConversations,
      totalServiceRecords: serviceRecordCount,
      demandesParStatut: demandesParStatut.map((g) => ({ statut: g.statut, count: g._count })),
      demandesParService: demandesParService.map((g) => ({ service: g.service, count: g._count })),
      convosParLangue: convosParLangue.map((g) => ({ langue: g.langue, count: g._count.id })),
      convosParIntent: convosParIntent.map((g) => ({ intent: g.intent || "inconnu", count: g._count.id })),
      convosParJour: Object.entries(convosParJour).map(([jour, count]) => ({ jour, count })),
    });
  }

  if (section === "demandes") {
    const demandes = await prisma.demande.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { compte: { select: { nom: true, prenom: true, email: true } } },
    });

    return NextResponse.json({
      demandes: demandes.map((d) => ({
        id: d.id,
        reference: d.reference,
        type: d.type,
        service: d.service,
        statut: d.statut.toLowerCase(),
        utilisateur: d.compte ? `${d.compte.prenom} ${d.compte.nom}` : "Anonyme",
        date: d.dateCreation,
      })),
    });
  }

  if (section === "users") {
    const comptes = await prisma.compte.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { demandes: true } } },
    });

    return NextResponse.json({
      users: comptes.map((c) => ({
        id: c.id,
        nom: `${c.prenom} ${c.nom}`,
        email: c.email,
        telephone: c.telephone,
        dateInscription: c.dateInscription,
        demandesCount: c._count.demandes,
      })),
    });
  }

  if (section === "logs") {
    const logs = await prisma.accessLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        heure: l.createdAt.toISOString().split("T")[1]?.split(".")[0] || "",
        action: `${l.method} ${l.path}`,
        utilisateur: l.compteId || "anonyme",
        ip: l.ip || "unknown",
        statut: l.statut >= 400 ? "erreur" : l.statut >= 300 ? "warn" : "ok",
      })),
    });
  }

  if (section === "conversations") {
    const convos = await prisma.conversationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      conversations: convos.map((c) => ({
        id: c.id,
        message: c.message.substring(0, 100),
        langue: c.langue,
        intent: c.intent,
        domaine: c.domaine,
        date: c.createdAt.toISOString(),
      })),
    });
  }

  return NextResponse.json({ error: "Section inconnue" }, { status: 400 });
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const body = await req.json();
  const { demandeId, statut } = body;

  if (!demandeId || !statut) {
    return NextResponse.json({ error: "demandeId et statut requis" }, { status: 400 });
  }

  const demande = await prisma.demande.update({
    where: { id: demandeId },
    data: { statut: statut.toUpperCase(), dateMiseAJour: new Date().toISOString().split("T")[0] },
    include: { compte: { select: { nom: true, prenom: true, email: true, telephone: true } } },
  });

  // Notifier le citoyen du changement de statut
  if (demande.compte) {
    const { envoyerEmail, envoyerWhatsApp } = await import("@/lib/notifications");
    const notifData = {
      destinataire: {
        nom: demande.compte.nom,
        prenom: demande.compte.prenom,
        email: demande.compte.email,
        telephone: demande.compte.telephone,
      },
      type: statut === "disponible" ? "document_pret" as const : "statut_update" as const,
      reference: demande.reference,
      service: demande.service,
      statut,
    };
    Promise.allSettled([envoyerEmail(notifData), envoyerWhatsApp(notifData)]).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
