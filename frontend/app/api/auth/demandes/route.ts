import { NextRequest, NextResponse } from "next/server";
import { verifierToken, getCompteById, ajouterDemande } from "@/lib/auth";
import { logAccess } from "@/lib/access-log";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("sunubot_token")?.value
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });

  const payload = verifierToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalide." }, { status: 401 });

  const compte = await getCompteById(payload.id);
  if (!compte) return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });

  return NextResponse.json({ success: true, demandes: compte.demandes });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("sunubot_token")?.value
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });

  const payload = verifierToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalide." }, { status: 401 });

  const body = await req.json();
  const { type, service, reference, details } = body;
  if (!type || !service || !reference) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }

  const demande = await ajouterDemande(payload.id, {
    type,
    service,
    statut: "recu",
    reference,
    details: details || {},
  });

  if (!demande) return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });

  // Notification email + WhatsApp
  let notifications = { email: false, whatsapp: false };
  const compte = await getCompteById(payload.id);
  if (compte) {
    const { envoyerEmail, envoyerWhatsApp } = await import("@/lib/notifications");
    const notifData = {
      destinataire: { nom: compte.nom, prenom: compte.prenom, email: compte.email, telephone: compte.telephone },
      type: "confirmation_demande" as const,
      reference,
      service,
    };
    const [emailRes, waRes] = await Promise.allSettled([
      envoyerEmail(notifData),
      envoyerWhatsApp(notifData),
    ]);
    notifications = {
      email: emailRes.status === "fulfilled" && emailRes.value.success,
      whatsapp: waRes.status === "fulfilled" && waRes.value.success,
    };
  }

  logAccess(req, 201, payload.id);
  return NextResponse.json({ success: true, demande, notifications }, { status: 201 });
}
