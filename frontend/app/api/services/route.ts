import { NextRequest, NextResponse } from "next/server";
import {
  rechercherContribuable,
  inscrireContribuable,
  rechercherAssureCNSS,
  inscrireAssureCNSS,
  rechercherBoursier,
  inscrireBoursier,
  rechercherAssureCMU,
  inscrireAssureCMU,
  rechercherParNumero,
} from "@/lib/data-services";
import { logAccess } from "@/lib/access-log";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, service, donnees, query } = body;

  // Recherche par numero (universel)
  if (action === "rechercher_numero") {
    const result = await rechercherParNumero(query);
    logAccess(req, 200);
    if (result.data) {
      return NextResponse.json({ found: true, type: result.type, data: result.data });
    }
    return NextResponse.json({ found: false });
  }

  // Recherche par nom
  if (action === "rechercher") {
    let resultats: unknown[] = [];
    switch (service) {
      case "dgid":
        resultats = await rechercherContribuable(query) as unknown[];
        break;
      case "cnss":
        resultats = await rechercherAssureCNSS(query) as unknown[];
        break;
      case "bourse":
        resultats = await rechercherBoursier(query) as unknown[];
        break;
      case "cmu":
        resultats = await rechercherAssureCMU(query) as unknown[];
        break;
    }
    return NextResponse.json({ found: resultats.length > 0, count: resultats.length, resultats });
  }

  // Inscription
  if (action === "inscrire") {
    try {
      let nouveau: unknown;
      switch (service) {
        case "dgid":
          nouveau = await inscrireContribuable(donnees);
          break;
        case "cnss":
          nouveau = await inscrireAssureCNSS(donnees);
          break;
        case "bourse":
          nouveau = await inscrireBoursier(donnees);
          break;
        case "cmu":
          nouveau = await inscrireAssureCMU(donnees);
          break;
        default:
          return NextResponse.json({ error: "Service inconnu" }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: nouveau });
    } catch {
      return NextResponse.json({ error: "Erreur lors de l'inscription" }, { status: 500 });
    }
  }

  logAccess(req, 400);
  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
