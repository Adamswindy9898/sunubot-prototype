import { NextRequest, NextResponse } from "next/server";
import { creerCompte } from "@/lib/auth";
import { notifier } from "@/lib/notifications";
import { logAccess } from "@/lib/access-log";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nom, prenom, email, telephone, password } = body;

  if (!nom || !prenom || !email || !telephone || !password) {
    logAccess(req, 400);
    return NextResponse.json({ error: "Tous les champs sont obligatoires." }, { status: 400 });
  }
  if (password.length < 6) {
    logAccess(req, 400);
    return NextResponse.json({ error: "Le mot de passe doit avoir au moins 6 caracteres." }, { status: 400 });
  }

  const result = await creerCompte({ nom, prenom, email, telephone, password });
  if (!result.success) {
    logAccess(req, 409);
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  logAccess(req, 201, result.compte?.id);

  // Notification de bienvenue (async, sans bloquer la réponse)
  notifier({
    destinataire: { nom: nom.toUpperCase(), prenom, email, telephone },
    type: "bienvenue",
  }).catch(() => {});

  const { passwordHash: _, ...comptePublic } = result.compte!;
  return NextResponse.json({ success: true, compte: comptePublic }, { status: 201 });
}
