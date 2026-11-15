import { NextRequest, NextResponse } from "next/server";
import { rechercherCitoyen, soumettreDemande, rechercherDemande } from "@/lib/data-citoyens";
import { logAccess } from "@/lib/access-log";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "soumettre") {
    const { nom, prenom, type_document, donnees } = body;

    if (!nom || !prenom) {
      return NextResponse.json({ error: "Nom et prenom requis" }, { status: 400 });
    }

    const resultats = await rechercherCitoyen(`${prenom} ${nom}`);
    if (resultats.length === 0) {
      return NextResponse.json(
        { error: "Citoyen non trouve dans les registres" },
        { status: 404 }
      );
    }

    const citoyen = resultats[0];
    const demande = await soumettreDemande(citoyen, type_document || "acte_naissance", donnees || {});

    return NextResponse.json({
      success: true,
      demande: {
        numero_suivi: demande.numero_suivi,
        statut: demande.statut,
        date_soumission: demande.date_soumission,
        date_prevue: demande.date_prevue,
        lieu_retrait: demande.lieu_retrait,
        delai: "1 jour ouvrable",
      },
    });
  }

  if (action === "suivre") {
    const { numero_suivi } = body;

    if (!numero_suivi) {
      return NextResponse.json({ error: "Numero de suivi requis" }, { status: 400 });
    }

    const demande = await rechercherDemande(numero_suivi);
    if (!demande) {
      return NextResponse.json({ error: "Demande non trouvee" }, { status: 404 });
    }

    const statutLabels: Record<string, string> = {
      soumise: "Soumise - En attente de traitement",
      en_traitement: "En cours de traitement",
      prete: "Prete - A retirer",
      retiree: "Retiree",
    };

    return NextResponse.json({
      success: true,
      demande: {
        numero_suivi: demande.numero_suivi,
        nom: demande.nom,
        prenom: demande.prenom,
        type_document: demande.type_document,
        statut: demande.statut,
        statut_label: statutLabels[demande.statut] || demande.statut,
        date_soumission: demande.date_soumission,
        date_prevue: demande.date_prevue,
        lieu_retrait: demande.lieu_retrait,
      },
    });
  }

  logAccess(req, 400);
  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
