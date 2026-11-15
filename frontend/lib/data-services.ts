// Services administratifs (DGID, CNSS, Education, Santé) — Prisma
import prisma from "@/lib/prisma";

export interface Contribuable {
  id: string;
  ninea: string;
  nom: string;
  prenom: string;
  type: "personne_physique" | "personne_morale";
  activite: string;
  regime_fiscal: "CGU" | "reel_simplifie" | "reel_normal";
  adresse: string;
  telephone: string;
  centre_fiscal: string;
  date_inscription: string;
  statut: "actif" | "suspendu";
  chiffre_affaires: string;
}

export interface AssureCNSS {
  id: string;
  numero_cnss: string;
  nom: string;
  prenom: string;
  type: "salarie" | "employeur";
  employeur?: string;
  secteur: string;
  date_inscription: string;
  statut: "actif" | "retraite" | "suspendu";
  cotisations_jour: number;
  telephone: string;
  prestations: string[];
}

export interface Boursier {
  id: string;
  numero_bourse: string;
  nom: string;
  prenom: string;
  universite: string;
  filiere: string;
  niveau: string;
  montant_mensuel: string;
  date_inscription: string;
  statut: "active" | "suspendue" | "terminee";
  telephone: string;
}

export interface AssureCMU {
  id: string;
  numero_cmu: string;
  nom: string;
  prenom: string;
  type_menage: "individuel" | "familial";
  membres_couverts: number;
  mutuelle: string;
  date_inscription: string;
  statut: "active" | "expiree" | "en_attente";
  cotisation_annuelle: string;
  telephone: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseData(raw: string): Record<string, unknown> {
  try { return JSON.parse(raw); } catch { return {}; }
}

function fromRecord<T>(record: {
  id: string; reference: string; nom: string; prenom: string;
  telephone: string | null; data: string; statut: string; createdAt: Date;
}, mapper: (d: Record<string, unknown>, r: typeof record) => T): T {
  return mapper(parseData(record.data), record);
}

// ─── DGID ──────────────────────────────────────────────────────────────────

export async function rechercherContribuable(query: string): Promise<Contribuable[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const records = await prisma.serviceRecord.findMany({
    where: { type: "dgid", OR: [{ nom: { contains: q } }, { prenom: { contains: q } }, { reference: { contains: q } }] },
    orderBy: { createdAt: "desc" }, take: 20,
  });
  return records.map((r) => fromRecord(r, (d) => ({
    id: r.id, ninea: r.reference, nom: r.nom, prenom: r.prenom,
    type: (d.type as Contribuable["type"]) || "personne_physique",
    activite: (d.activite as string) || "",
    regime_fiscal: (d.regime_fiscal as Contribuable["regime_fiscal"]) || "CGU",
    adresse: (d.adresse as string) || "",
    telephone: r.telephone || "",
    centre_fiscal: (d.centre_fiscal as string) || "CDI Dakar",
    date_inscription: r.createdAt.toISOString().split("T")[0],
    statut: (r.statut as Contribuable["statut"]) || "actif",
    chiffre_affaires: (d.chiffre_affaires as string) || "Non déclaré",
  })));
}

export async function getContribuableByNinea(ninea: string): Promise<Contribuable | undefined> {
  const r = await prisma.serviceRecord.findFirst({ where: { type: "dgid", reference: ninea.toUpperCase() } });
  if (!r) return undefined;
  const d = parseData(r.data);
  return {
    id: r.id, ninea: r.reference, nom: r.nom, prenom: r.prenom,
    type: (d.type as Contribuable["type"]) || "personne_physique",
    activite: (d.activite as string) || "",
    regime_fiscal: (d.regime_fiscal as Contribuable["regime_fiscal"]) || "CGU",
    adresse: (d.adresse as string) || "",
    telephone: r.telephone || "",
    centre_fiscal: (d.centre_fiscal as string) || "CDI Dakar",
    date_inscription: r.createdAt.toISOString().split("T")[0],
    statut: (r.statut as Contribuable["statut"]) || "actif",
    chiffre_affaires: (d.chiffre_affaires as string) || "Non déclaré",
  };
}

export async function inscrireContribuable(donnees: {
  nom: string; prenom: string; activite: string;
  type: "personne_physique" | "personne_morale"; adresse: string; telephone: string;
}): Promise<Contribuable> {
  const count = await prisma.serviceRecord.count({ where: { type: "dgid" } });
  const ninea = `NIN-2024-${String(count + 1).padStart(3, "0")}`;

  const r = await prisma.serviceRecord.create({
    data: {
      type: "dgid", reference: ninea,
      nom: donnees.nom.toUpperCase(), prenom: donnees.prenom,
      telephone: donnees.telephone,
      data: JSON.stringify({
        type: donnees.type, activite: donnees.activite,
        regime_fiscal: "CGU", adresse: donnees.adresse,
        centre_fiscal: "CDI Dakar", chiffre_affaires: "Non déclaré",
      }),
      statut: "actif",
    },
  });

  return {
    id: r.id, ninea, nom: r.nom, prenom: r.prenom,
    type: donnees.type, activite: donnees.activite,
    regime_fiscal: "CGU", adresse: donnees.adresse,
    telephone: donnees.telephone, centre_fiscal: "CDI Dakar",
    date_inscription: r.createdAt.toISOString().split("T")[0],
    statut: "actif", chiffre_affaires: "Non déclaré",
  };
}

// ─── CNSS ──────────────────────────────────────────────────────────────────

export async function rechercherAssureCNSS(query: string): Promise<AssureCNSS[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const records = await prisma.serviceRecord.findMany({
    where: { type: "cnss", OR: [{ nom: { contains: q } }, { prenom: { contains: q } }, { reference: { contains: q } }] },
    orderBy: { createdAt: "desc" }, take: 20,
  });
  return records.map((r) => {
    const d = parseData(r.data);
    return {
      id: r.id, numero_cnss: r.reference, nom: r.nom, prenom: r.prenom,
      type: (d.type as AssureCNSS["type"]) || "salarie",
      employeur: d.employeur as string | undefined,
      secteur: (d.secteur as string) || "",
      date_inscription: r.createdAt.toISOString().split("T")[0],
      statut: (r.statut as AssureCNSS["statut"]) || "actif",
      cotisations_jour: (d.cotisations_jour as number) || 0,
      telephone: r.telephone || "",
      prestations: (d.prestations as string[]) || ["allocations_familiales"],
    };
  });
}

export async function getAssureByNumero(numero: string): Promise<AssureCNSS | undefined> {
  const r = await prisma.serviceRecord.findFirst({ where: { type: "cnss", reference: numero.toUpperCase() } });
  if (!r) return undefined;
  const d = parseData(r.data);
  return {
    id: r.id, numero_cnss: r.reference, nom: r.nom, prenom: r.prenom,
    type: (d.type as AssureCNSS["type"]) || "salarie",
    employeur: d.employeur as string | undefined,
    secteur: (d.secteur as string) || "",
    date_inscription: r.createdAt.toISOString().split("T")[0],
    statut: (r.statut as AssureCNSS["statut"]) || "actif",
    cotisations_jour: (d.cotisations_jour as number) || 0,
    telephone: r.telephone || "",
    prestations: (d.prestations as string[]) || ["allocations_familiales"],
  };
}

export async function inscrireAssureCNSS(donnees: {
  nom: string; prenom: string; type: "salarie" | "employeur";
  employeur?: string; secteur: string; telephone: string;
}): Promise<AssureCNSS> {
  const count = await prisma.serviceRecord.count({ where: { type: "cnss" } });
  const numero = `CSS-2024-${String(count + 1).padStart(3, "0")}`;

  const r = await prisma.serviceRecord.create({
    data: {
      type: "cnss", reference: numero,
      nom: donnees.nom.toUpperCase(), prenom: donnees.prenom,
      telephone: donnees.telephone,
      data: JSON.stringify({
        type: donnees.type, employeur: donnees.employeur,
        secteur: donnees.secteur, cotisations_jour: 0,
        prestations: ["allocations_familiales"],
      }),
      statut: "actif",
    },
  });

  return {
    id: r.id, numero_cnss: numero, nom: r.nom, prenom: r.prenom,
    type: donnees.type, employeur: donnees.employeur,
    secteur: donnees.secteur, date_inscription: r.createdAt.toISOString().split("T")[0],
    statut: "actif", cotisations_jour: 0,
    telephone: donnees.telephone, prestations: ["allocations_familiales"],
  };
}

// ─── Éducation (Boursiers) ─────────────────────────────────────────────────

export async function rechercherBoursier(query: string): Promise<Boursier[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const records = await prisma.serviceRecord.findMany({
    where: { type: "bourse", OR: [{ nom: { contains: q } }, { prenom: { contains: q } }, { reference: { contains: q } }] },
    orderBy: { createdAt: "desc" }, take: 20,
  });
  return records.map((r) => {
    const d = parseData(r.data);
    return {
      id: r.id, numero_bourse: r.reference, nom: r.nom, prenom: r.prenom,
      universite: (d.universite as string) || "",
      filiere: (d.filiere as string) || "",
      niveau: (d.niveau as string) || "",
      montant_mensuel: (d.montant_mensuel as string) || "40 000 FCFA",
      date_inscription: r.createdAt.toISOString().split("T")[0],
      statut: (r.statut as Boursier["statut"]) || "active",
      telephone: r.telephone || "",
    };
  });
}

export async function getBoursierByNumero(numero: string): Promise<Boursier | undefined> {
  const r = await prisma.serviceRecord.findFirst({ where: { type: "bourse", reference: numero.toUpperCase() } });
  if (!r) return undefined;
  const d = parseData(r.data);
  return {
    id: r.id, numero_bourse: r.reference, nom: r.nom, prenom: r.prenom,
    universite: (d.universite as string) || "",
    filiere: (d.filiere as string) || "",
    niveau: (d.niveau as string) || "",
    montant_mensuel: (d.montant_mensuel as string) || "40 000 FCFA",
    date_inscription: r.createdAt.toISOString().split("T")[0],
    statut: (r.statut as Boursier["statut"]) || "active",
    telephone: r.telephone || "",
  };
}

export async function inscrireBoursier(donnees: {
  nom: string; prenom: string; universite: string;
  filiere: string; niveau: string; telephone: string;
}): Promise<Boursier> {
  const count = await prisma.serviceRecord.count({ where: { type: "bourse" } });
  const numero = `BRS-2024-${String(count + 1).padStart(3, "0")}`;

  const r = await prisma.serviceRecord.create({
    data: {
      type: "bourse", reference: numero,
      nom: donnees.nom.toUpperCase(), prenom: donnees.prenom,
      telephone: donnees.telephone,
      data: JSON.stringify({
        universite: donnees.universite, filiere: donnees.filiere,
        niveau: donnees.niveau, montant_mensuel: "40 000 FCFA",
      }),
      statut: "active",
    },
  });

  return {
    id: r.id, numero_bourse: numero, nom: r.nom, prenom: r.prenom,
    universite: donnees.universite, filiere: donnees.filiere,
    niveau: donnees.niveau, montant_mensuel: "40 000 FCFA",
    date_inscription: r.createdAt.toISOString().split("T")[0],
    statut: "active", telephone: donnees.telephone,
  };
}

// ─── Santé (CMU) ───────────────────────────────────────────────────────────

export async function rechercherAssureCMU(query: string): Promise<AssureCMU[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const records = await prisma.serviceRecord.findMany({
    where: { type: "cmu", OR: [{ nom: { contains: q } }, { prenom: { contains: q } }, { reference: { contains: q } }] },
    orderBy: { createdAt: "desc" }, take: 20,
  });
  return records.map((r) => {
    const d = parseData(r.data);
    return {
      id: r.id, numero_cmu: r.reference, nom: r.nom, prenom: r.prenom,
      type_menage: (d.type_menage as AssureCMU["type_menage"]) || "individuel",
      membres_couverts: (d.membres_couverts as number) || 1,
      mutuelle: (d.mutuelle as string) || "Mutuelle communautaire",
      date_inscription: r.createdAt.toISOString().split("T")[0],
      statut: (r.statut as AssureCMU["statut"]) || "active",
      cotisation_annuelle: (d.cotisation_annuelle as string) || "3 500 FCFA",
      telephone: r.telephone || "",
    };
  });
}

export async function getAssureCMUByNumero(numero: string): Promise<AssureCMU | undefined> {
  const r = await prisma.serviceRecord.findFirst({ where: { type: "cmu", reference: numero.toUpperCase() } });
  if (!r) return undefined;
  const d = parseData(r.data);
  return {
    id: r.id, numero_cmu: r.reference, nom: r.nom, prenom: r.prenom,
    type_menage: (d.type_menage as AssureCMU["type_menage"]) || "individuel",
    membres_couverts: (d.membres_couverts as number) || 1,
    mutuelle: (d.mutuelle as string) || "Mutuelle communautaire",
    date_inscription: r.createdAt.toISOString().split("T")[0],
    statut: (r.statut as AssureCMU["statut"]) || "active",
    cotisation_annuelle: (d.cotisation_annuelle as string) || "3 500 FCFA",
    telephone: r.telephone || "",
  };
}

export async function inscrireAssureCMU(donnees: {
  nom: string; prenom: string; type_menage: "individuel" | "familial";
  membres_couverts: number; telephone: string;
}): Promise<AssureCMU> {
  const count = await prisma.serviceRecord.count({ where: { type: "cmu" } });
  const numero = `CMU-2024-${String(count + 1).padStart(3, "0")}`;
  const cotisation = donnees.type_menage === "familial" ? "7 000 FCFA" : "3 500 FCFA";

  const r = await prisma.serviceRecord.create({
    data: {
      type: "cmu", reference: numero,
      nom: donnees.nom.toUpperCase(), prenom: donnees.prenom,
      telephone: donnees.telephone,
      data: JSON.stringify({
        type_menage: donnees.type_menage,
        membres_couverts: donnees.membres_couverts,
        mutuelle: "Mutuelle communautaire",
        cotisation_annuelle: cotisation,
      }),
      statut: "active",
    },
  });

  return {
    id: r.id, numero_cmu: numero, nom: r.nom, prenom: r.prenom,
    type_menage: donnees.type_menage,
    membres_couverts: donnees.membres_couverts,
    mutuelle: "Mutuelle communautaire",
    date_inscription: r.createdAt.toISOString().split("T")[0],
    statut: "active", cotisation_annuelle: cotisation,
    telephone: donnees.telephone,
  };
}

// ─── Recherche universelle par numéro ──────────────────────────────────────

export async function rechercherParNumero(numero: string): Promise<{
  type: "dgid" | "cnss" | "bourse" | "cmu" | null;
  data: Contribuable | AssureCNSS | Boursier | AssureCMU | null;
}> {
  const n = numero.toUpperCase().trim();

  if (n.startsWith("NIN-")) {
    const found = await getContribuableByNinea(n);
    return { type: found ? "dgid" : null, data: found || null };
  }
  if (n.startsWith("CSS-")) {
    const found = await getAssureByNumero(n);
    return { type: found ? "cnss" : null, data: found || null };
  }
  if (n.startsWith("BRS-")) {
    const found = await getBoursierByNumero(n);
    return { type: found ? "bourse" : null, data: found || null };
  }
  if (n.startsWith("CMU-")) {
    const found = await getAssureCMUByNumero(n);
    return { type: found ? "cmu" : null, data: found || null };
  }

  return { type: null, data: null };
}
