// État civil — accès Prisma (SQLite/PostgreSQL)
import prisma from "@/lib/prisma";

export interface Citoyen {
  id: string;
  numero_acte: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  nom_pere: string;
  nom_mere: string;
  commune: string;
  centre_etat_civil: string;
  date_declaration: string;
}

export interface DemandeFormulaire {
  id: string;
  numero_suivi: string;
  citoyen_id: string;
  nom: string;
  prenom: string;
  type_document: string;
  statut: "soumise" | "en_traitement" | "prete" | "retiree";
  date_soumission: string;
  date_prevue: string;
  lieu_retrait: string;
  donnees: Record<string, string>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function citoyenFromPrisma(c: {
  id: string; numero_acte: string; nom: string; prenom: string;
  date_naissance: string; lieu_naissance: string; nom_pere: string;
  nom_mere: string; commune: string; centre_etat_civil: string; createdAt: Date;
}): Citoyen {
  return {
    id: c.id,
    numero_acte: c.numero_acte,
    nom: c.nom,
    prenom: c.prenom,
    date_naissance: c.date_naissance,
    lieu_naissance: c.lieu_naissance,
    nom_pere: c.nom_pere,
    nom_mere: c.nom_mere,
    commune: c.commune,
    centre_etat_civil: c.centre_etat_civil,
    date_declaration: c.createdAt.toISOString().split("T")[0],
  };
}

// ─── Inscription citoyen ───────────────────────────────────────────────────

export async function inscrireCitoyen(donnees: {
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  nom_pere: string;
  nom_mere: string;
  telephone?: string;
}): Promise<Citoyen> {
  const count = await prisma.citoyen.count();
  const num = count + 1;
  const regionCode = donnees.lieu_naissance.substring(0, 3).toUpperCase();
  const numero_acte = `N-2024-${String(num).padStart(3, "0")}-${regionCode}`;

  const c = await prisma.citoyen.create({
    data: {
      numero_acte,
      nom: donnees.nom.toUpperCase(),
      prenom: donnees.prenom,
      date_naissance: donnees.date_naissance,
      lieu_naissance: donnees.lieu_naissance,
      nom_pere: donnees.nom_pere,
      nom_mere: donnees.nom_mere,
      telephone: donnees.telephone || null,
      commune: donnees.lieu_naissance,
      centre_etat_civil: `Centre d'Etat Civil de ${donnees.lieu_naissance}`,
    },
  });

  return citoyenFromPrisma(c);
}

// ─── Recherche ─────────────────────────────────────────────────────────────

export async function rechercherCitoyen(query: string): Promise<Citoyen[]> {
  const q = query.trim();
  if (!q) return [];

  // Séparer les mots pour recherche multi-champ
  const words = q.split(/\s+/).filter(w => w.length > 1);
  const qLower = q.toLowerCase();

  // Construire les conditions OR pour chaque mot (chaque variante de casse)
  const orConditions: object[] = [];
  for (const word of words) {
    const wLower = word.toLowerCase();
    const wUpper = word.toUpperCase();
    const wCap = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    orConditions.push(
      { nom: { contains: wLower } }, { nom: { contains: wUpper } }, { nom: { contains: wCap } },
      { prenom: { contains: wLower } }, { prenom: { contains: wUpper } }, { prenom: { contains: wCap } },
    );
  }
  // Recherche par numéro d'acte si ça ressemble à un numéro
  if (q.match(/^N-/i)) {
    orConditions.push({ numero_acte: { contains: q } });
  }

  const results = await prisma.citoyen.findMany({
    where: { OR: orConditions },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Filtre post-requête : au moins un mot doit matcher nom ou prénom
  return results.map(citoyenFromPrisma).filter((c) => {
    const full = `${c.prenom} ${c.nom}`.toLowerCase();
    return words.some(w => full.includes(w.toLowerCase())) ||
      c.numero_acte.toLowerCase().includes(qLower);
  });
}

export async function getCitoyenByNumero(numero: string): Promise<Citoyen | null> {
  const c = await prisma.citoyen.findFirst({
    where: { numero_acte: { equals: numero } },
  });
  return c ? citoyenFromPrisma(c) : null;
}

// ─── Demandes (stockées dans ServiceRecord type="etat_civil") ─────────────

export async function rechercherDemande(query: string): Promise<DemandeFormulaire | null> {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  const record = await prisma.serviceRecord.findFirst({
    where: {
      type: "etat_civil",
      OR: [
        { reference: { equals: q.toUpperCase() } },
        { nom: { contains: q } },
        { prenom: { contains: q } },
      ],
    },
  });

  if (!record) return null;

  let data: Record<string, string> = {};
  try { data = JSON.parse(record.data); } catch { /* skip */ }

  return {
    id: record.id,
    numero_suivi: record.reference,
    citoyen_id: data.citoyen_id || "",
    nom: record.nom,
    prenom: record.prenom,
    type_document: data.type_document || "acte_naissance",
    statut: (record.statut as DemandeFormulaire["statut"]) || "soumise",
    date_soumission: record.createdAt.toISOString().split("T")[0],
    date_prevue: data.date_prevue || record.createdAt.toISOString().split("T")[0],
    lieu_retrait: data.lieu_retrait || "Centre d'Etat Civil",
    donnees: data.donnees ? JSON.parse(data.donnees) : {},
  };
}

export async function soumettreDemande(
  citoyen: Citoyen,
  type_document: string,
  donnees: Record<string, string>
): Promise<DemandeFormulaire> {
  const count = await prisma.serviceRecord.count({ where: { type: "etat_civil" } });
  const num = count + 1;
  const reference = `DEM-2024-${String(num).padStart(3, "0")}`;

  const now = new Date();
  const datePrevue = new Date(now);
  datePrevue.setDate(datePrevue.getDate() + 1);

  const record = await prisma.serviceRecord.create({
    data: {
      type: "etat_civil",
      reference,
      nom: citoyen.nom,
      prenom: citoyen.prenom,
      telephone: undefined,
      data: JSON.stringify({
        citoyen_id: citoyen.id,
        type_document,
        date_prevue: datePrevue.toISOString().split("T")[0],
        lieu_retrait: citoyen.centre_etat_civil,
        donnees: JSON.stringify(donnees),
      }),
      statut: "soumise",
    },
  });

  return {
    id: record.id,
    numero_suivi: reference,
    citoyen_id: citoyen.id,
    nom: citoyen.nom,
    prenom: citoyen.prenom,
    type_document,
    statut: "soumise",
    date_soumission: now.toISOString().split("T")[0],
    date_prevue: datePrevue.toISOString().split("T")[0],
    lieu_retrait: citoyen.centre_etat_civil,
    donnees,
  };
}
