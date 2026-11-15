import { NextRequest, NextResponse } from "next/server";
import { rechercherCitoyen, getCitoyenByNumero } from "@/lib/data-citoyens";
import { logAccess } from "@/lib/access-log";

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "Query requise" }, { status: 400 });
  }

  const parNumero = await getCitoyenByNumero(query);
  if (parNumero) {
    return NextResponse.json({ found: true, count: 1, citoyens: [parNumero] });
  }

  const resultats = await rechercherCitoyen(query);

  logAccess(req, 200);
  return NextResponse.json({
    found: resultats.length > 0,
    count: resultats.length,
    citoyens: resultats,
  });
}
