// Logger d'accès — enregistre chaque requête API dans AccessLog
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export function logAccess(req: NextRequest, statut: number, compteId?: string | null) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "";
  const method = req.method;
  const path = req.nextUrl.pathname;

  // Fire-and-forget — ne bloque pas la réponse
  prisma.accessLog.create({
    data: {
      action: `${method} ${path}`,
      method,
      path,
      ip: ip.split(",")[0].trim(),
      userAgent: userAgent.substring(0, 200),
      statut,
      compteId: compteId || null,
    },
  }).catch(() => {});
}
