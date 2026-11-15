import { NextRequest, NextResponse } from "next/server";
import { getSessionTraces, saveTracesToFile, clearSessionTraces } from "@/lib/mcp-tracer";

// GET /api/traces — voir les traces de la session en cours
export async function GET() {
  const traces = getSessionTraces();
  return NextResponse.json({
    count: traces.length,
    traces,
  });
}

// POST /api/traces — action: "save" pour sauvegarder en fichier, "clear" pour vider
export async function POST(req: NextRequest) {
  const { action } = await req.json();

  if (action === "save") {
    const result = await saveTracesToFile();
    return NextResponse.json({ success: true, message: result });
  }

  if (action === "clear") {
    clearSessionTraces();
    return NextResponse.json({ success: true, message: "Traces cleared" });
  }

  return NextResponse.json({ error: "Action invalide. Utilisez 'save' ou 'clear'." }, { status: 400 });
}
