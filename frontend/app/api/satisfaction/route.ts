import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifierToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nps, mos, commentaire, langue, service } = body;

  if (nps === undefined || mos === undefined) {
    return NextResponse.json({ error: "nps et mos sont requis" }, { status: 400 });
  }
  if (nps < 0 || nps > 10 || mos < 1 || mos > 5) {
    return NextResponse.json({ error: "Scores invalides" }, { status: 400 });
  }

  const token = req.cookies.get("sunubot_token")?.value
    || req.headers.get("authorization")?.replace("Bearer ", "");
  const payload = token ? verifierToken(token) : null;

  await prisma.satisfaction.create({
    data: {
      nps: parseInt(nps),
      mos: parseInt(mos),
      commentaire: commentaire || null,
      langue: langue || "francais",
      service: service || null,
      compteId: payload?.id || null,
      ip: req.headers.get("x-forwarded-for") || null,
    },
  });

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("x-admin-token");
  if (auth !== (process.env.ADMIN_PASSWORD || "admin2024")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const satisfactions = await prisma.satisfaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const total = satisfactions.length;
  if (total === 0) {
    return NextResponse.json({ total: 0, nps_moyen: 0, mos_moyen: 0, satisfactions: [] });
  }

  const nps_moyen = Math.round(satisfactions.reduce((s, r) => s + r.nps, 0) / total * 10) / 10;
  const mos_moyen = Math.round(satisfactions.reduce((s, r) => s + r.mos, 0) / total * 10) / 10;

  // Calcul NPS réel : % promoteurs (9-10) - % détracteurs (0-6)
  const promoteurs = satisfactions.filter(r => r.nps >= 9).length;
  const detracteurs = satisfactions.filter(r => r.nps <= 6).length;
  const score_nps = Math.round(((promoteurs - detracteurs) / total) * 100);

  return NextResponse.json({
    total,
    nps_moyen,
    mos_moyen,
    score_nps,
    promoteurs,
    detracteurs,
    satisfactions: satisfactions.map(s => ({
      id: s.id,
      nps: s.nps,
      mos: s.mos,
      commentaire: s.commentaire,
      langue: s.langue,
      service: s.service,
      date: s.createdAt,
    })),
  });
}
