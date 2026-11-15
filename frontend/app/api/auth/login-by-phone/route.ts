import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sunubot-secret-m2-ia-2024-thies";

// Connexion automatique par numéro de téléphone (pour WhatsApp)
// Si le compte existe → retourne un token temporaire
// Si le compte n'existe pas → retourne 404 (pas d'erreur)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { telephone } = body;

  if (!telephone) {
    return NextResponse.json({ error: "Téléphone requis." }, { status: 400 });
  }

  // Nettoyer le numéro (supprimer espaces)
  const tel = telephone.replace(/\s/g, "");

  try {
    const compte = await prisma.compte.findFirst({
      where: { telephone: { contains: tel } },
    });

    if (!compte) {
      return NextResponse.json({ found: false }, { status: 404 });
    }

    // Générer un token pour lier les demandes au compte
    const token = jwt.sign({ id: compte.id, email: compte.email }, JWT_SECRET, { expiresIn: "7d" });

    return NextResponse.json({
      found: true,
      token,
      compte: {
        id: compte.id,
        nom: compte.nom,
        prenom: compte.prenom,
        email: compte.email,
      },
    });
  } catch {
    return NextResponse.json({ found: false }, { status: 404 });
  }
}
