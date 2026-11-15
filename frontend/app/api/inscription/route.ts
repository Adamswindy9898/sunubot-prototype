import { NextRequest, NextResponse } from "next/server";
import { inscrireCitoyen, rechercherCitoyen } from "@/lib/data-citoyens";
import { logAccess } from "@/lib/access-log";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nom, prenom, date_naissance, lieu_naissance, nom_pere, nom_mere, telephone } = body;

  if (!nom || !prenom || !date_naissance || !lieu_naissance || !nom_pere || !nom_mere) {
    return NextResponse.json(
      { error: "Tous les champs obligatoires doivent etre remplis" },
      { status: 400 }
    );
  }

  const existe = await rechercherCitoyen(`${prenom} ${nom}`);
  if (existe.length > 0) {
    return NextResponse.json({
      success: false,
      error: "Ce citoyen est deja enregistre",
      citoyen: existe[0],
    });
  }

  const nouveau = await inscrireCitoyen({
    nom,
    prenom,
    date_naissance,
    lieu_naissance,
    nom_pere,
    nom_mere,
    telephone,
  });

  logAccess(req, 201);
  return NextResponse.json({
    success: true,
    message: "Inscription reussie",
    citoyen: nouveau,
  });
}
