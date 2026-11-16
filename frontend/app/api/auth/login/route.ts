import { NextRequest, NextResponse } from "next/server";
import { connecter } from "@/lib/auth";
import { logAccess } from "@/lib/access-log";

export async function POST(req: NextRequest) {
  // Rate limiting anti brute-force : 10 tentatives/minute par IP
  const { rateLimit } = await import("@/lib/rate-limit");
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const { allowed } = rateLimit(`login:${ip}`, 10, 60_000);
  if (!allowed) {
    logAccess(req, 429);
    return NextResponse.json({ error: "Trop de tentatives. Réessayez dans une minute." }, { status: 429 });
  }

  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    logAccess(req, 400);
    return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
  }

  const result = await connecter(email, password);
  if (!result.success) {
    logAccess(req, 401);
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  logAccess(req, 200, result.compte?.id);

  const response = NextResponse.json({ success: true, token: result.token, compte: result.compte });
  response.cookies.set("sunubot_token", result.token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}
