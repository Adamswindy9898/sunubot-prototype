import { NextRequest, NextResponse } from "next/server";

// Webhook WhatsApp (Meta Cloud API)
// GET : vérification du webhook par Meta
// POST : traitement des messages entrants

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "sunubot-webhook-2024";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Vérification échouée." }, { status: 403 });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ status: "ok" }); }

  // Log structuré pour le monitoring
  console.log("[SunuBot WhatsApp Webhook]", JSON.stringify(body, null, 2));

  // Traiter les messages entrants
  const data = body as {
    object?: string;
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: Array<{
            from: string;
            text?: { body: string };
            type: string;
          }>;
        };
      }>;
    }>;
  };

  if (data?.object === "whatsapp_business_account") {
    const messages = data.entry?.[0]?.changes?.[0]?.value?.messages;
    if (messages?.length) {
      for (const msg of messages) {
        if (msg.type === "text" && msg.text?.body) {
          const texte = msg.text.body.toLowerCase();
          const from = msg.from;

          // Réponse automatique selon le contenu
          let reponse = "";
          if (texte.includes("statut") || texte.includes("suivi") || texte.includes("topp")) {
            reponse = "Entrez votre numéro de référence (ex: CSS-2024-001) pour consulter le statut de votre demande.";
          } else if (texte.includes("bonjour") || texte.includes("salut") || texte.includes("mangui")) {
            reponse = "🇸🇳 Bonjour ! Je suis SunuBot, votre assistant administratif. Écrivez votre numéro de référence pour suivre votre demande, ou visitez notre site pour faire une nouvelle demande.";
          } else if (texte.match(/^(nin|css|brs|cmu)-\d{4}-\d{3}/i)) {
            reponse = `Demande ${texte.toUpperCase()} : statut en cours de vérification. Vous serez notifié dès mise à jour.`;
          } else {
            reponse = "Bienvenue sur SunuBot 🇸🇳. Envoyez votre numéro de référence pour suivre votre demande. Pour une nouvelle demande, rendez-vous sur le site SunuBot.";
          }

          // Envoyer la réponse si WhatsApp configuré
          const WA_TOKEN = process.env.WHATSAPP_TOKEN;
          const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
          if (WA_TOKEN && WA_PHONE_ID) {
            await fetch(`https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${WA_TOKEN}` },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: from,
                type: "text",
                text: { body: reponse },
              }),
            });
          } else {
            console.log(`[SunuBot WhatsApp Auto-reply SIMULATION] To: ${from}\n${reponse}`);
          }
        }
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
