import { NextRequest, NextResponse } from "next/server";
import { notifier } from "@/lib/notifications";
import { verifierToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("sunubot_token")?.value
    || req.headers.get("authorization")?.replace("Bearer ", "");

  // Vérification optionnelle — les notifications peuvent aussi être déclenchées sans auth (webhook interne)
  const payload = token ? verifierToken(token) : null;

  const body = await req.json();
  const { destinataire, type, reference, service, statut, langue } = body;

  if (!destinataire || !type) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }

  // Si l'utilisateur est connecté et n'a pas fourni d'email → utiliser celui du compte
  if (payload && !destinataire.email) {
    const { getCompteById } = await import("@/lib/auth");
    const compte = await getCompteById(payload.id);
    if (compte) {
      destinataire.email = compte.email;
      destinataire.nom = compte.nom;
      destinataire.prenom = compte.prenom;
      destinataire.telephone = compte.telephone;
    }
  }

  await notifier({ destinataire, type, reference, service, statut, langue });

  return NextResponse.json({ success: true, message: "Notifications envoyées." });
}
