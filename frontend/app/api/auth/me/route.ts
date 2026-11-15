import { NextRequest, NextResponse } from "next/server";
import { verifierToken, getCompteById } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("sunubot_token")?.value
    || req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });

  const payload = verifierToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalide ou expire." }, { status: 401 });

  const compte = await getCompteById(payload.id);
  if (!compte) return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });

  const { passwordHash: _, ...comptePublic } = compte;
  return NextResponse.json({ success: true, compte: comptePublic });
}
