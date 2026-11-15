// Authentification JWT pour SunuBot — avec Prisma (SQLite → PostgreSQL)
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "sunubot-secret-m2-ia-2024";
const JWT_EXPIRES = "7d";

export interface DemandeHistorique {
  id: string;
  type: string;
  service: string;
  statut: "recu" | "en_cours" | "valide" | "rejete" | "disponible";
  dateCreation: string;
  dateMiseAJour: string;
  reference: string;
  details: Record<string, string>;
}

export interface CitoyenAccount {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  passwordHash: string;
  dateInscription: string;
  numeroActe?: string;
  demandes: DemandeHistorique[];
}

export interface JWTPayload {
  id: string;
  email: string;
  nom: string;
  prenom: string;
}

// ─── Conversion Prisma → interface ────────────────────────────────────────

function statutToLower(s: string): DemandeHistorique["statut"] {
  const map: Record<string, DemandeHistorique["statut"]> = {
    RECU: "recu", EN_COURS: "en_cours", VALIDE: "valide", REJETE: "rejete", DISPONIBLE: "disponible",
  };
  return map[s] || "recu";
}

function statutToUpper(s: string): string {
  const map: Record<string, string> = {
    recu: "RECU", en_cours: "EN_COURS", valide: "VALIDE", rejete: "REJETE", disponible: "DISPONIBLE",
  };
  return map[s] || "RECU";
}

function demandeFromPrisma(d: {
  id: string; type: string; service: string; statut: string;
  dateCreation: string; dateMiseAJour: string; reference: string; details: string;
}): DemandeHistorique {
  return {
    id: d.id,
    type: d.type,
    service: d.service,
    statut: statutToLower(d.statut),
    dateCreation: d.dateCreation,
    dateMiseAJour: d.dateMiseAJour,
    reference: d.reference,
    details: (() => { try { return JSON.parse(d.details); } catch { return {}; } })(),
  };
}

// ─── Création de compte ────────────────────────────────────────────────────

export async function creerCompte(data: {
  nom: string; prenom: string; email: string; telephone: string; password: string;
}): Promise<{ success: boolean; error?: string; compte?: CitoyenAccount }> {
  const existe = await prisma.compte.findUnique({ where: { email: data.email } });
  if (existe) return { success: false, error: "Un compte existe deja avec cet email." };

  const passwordHash = await bcrypt.hash(data.password, 10);
  const compte = await prisma.compte.create({
    data: {
      nom: data.nom.toUpperCase(),
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      passwordHash,
      dateInscription: new Date().toISOString().split("T")[0],
    },
    include: { demandes: true },
  });

  return {
    success: true,
    compte: {
      id: compte.id,
      nom: compte.nom,
      prenom: compte.prenom,
      email: compte.email,
      telephone: compte.telephone,
      passwordHash: compte.passwordHash,
      dateInscription: compte.dateInscription,
      numeroActe: compte.numeroActe || undefined,
      demandes: compte.demandes.map(demandeFromPrisma),
    },
  };
}

// ─── Connexion ─────────────────────────────────────────────────────────────

export async function connecter(email: string, password: string): Promise<{
  success: boolean; error?: string; token?: string; compte?: Omit<CitoyenAccount, "passwordHash">;
}> {
  const compte = await prisma.compte.findUnique({
    where: { email },
    include: { demandes: { orderBy: { createdAt: "desc" } } },
  });
  if (!compte) return { success: false, error: "Email ou mot de passe incorrect." };

  const ok = await bcrypt.compare(password, compte.passwordHash);
  if (!ok) return { success: false, error: "Email ou mot de passe incorrect." };

  const payload: JWTPayload = {
    id: compte.id, email: compte.email, nom: compte.nom, prenom: compte.prenom,
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

  return {
    success: true,
    token,
    compte: {
      id: compte.id,
      nom: compte.nom,
      prenom: compte.prenom,
      email: compte.email,
      telephone: compte.telephone,
      dateInscription: compte.dateInscription,
      numeroActe: compte.numeroActe || undefined,
      demandes: compte.demandes.map(demandeFromPrisma),
    },
  };
}

// ─── Vérification token ────────────────────────────────────────────────────

export function verifierToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// ─── Récupérer compte par ID ───────────────────────────────────────────────

export async function getCompteById(id: string): Promise<CitoyenAccount | null> {
  const compte = await prisma.compte.findUnique({
    where: { id },
    include: { demandes: { orderBy: { createdAt: "desc" } } },
  });
  if (!compte) return null;
  return {
    id: compte.id,
    nom: compte.nom,
    prenom: compte.prenom,
    email: compte.email,
    telephone: compte.telephone,
    passwordHash: compte.passwordHash,
    dateInscription: compte.dateInscription,
    numeroActe: compte.numeroActe || undefined,
    demandes: compte.demandes.map(demandeFromPrisma),
  };
}

// ─── Ajouter une demande ───────────────────────────────────────────────────

export async function ajouterDemande(
  compteId: string,
  data: Omit<DemandeHistorique, "id" | "dateCreation" | "dateMiseAJour">
): Promise<DemandeHistorique | null> {
  const now = new Date().toISOString().split("T")[0];
  try {
    const demande = await prisma.demande.create({
      data: {
        reference: data.reference,
        type: data.type,
        service: data.service,
        statut: statutToUpper(data.statut),
        details: JSON.stringify(data.details || {}),
        dateCreation: now,
        dateMiseAJour: now,
        compteId,
      },
    });
    return demandeFromPrisma(demande);
  } catch {
    return null;
  }
}

// ─── Mettre à jour le statut ───────────────────────────────────────────────

export async function majStatutDemande(
  compteId: string,
  demandeId: string,
  statut: DemandeHistorique["statut"]
): Promise<boolean> {
  try {
    await prisma.demande.updateMany({
      where: { id: demandeId, compteId },
      data: {
        statut: statutToUpper(statut),
        dateMiseAJour: new Date().toISOString().split("T")[0],
      },
    });
    return true;
  } catch {
    return false;
  }
}
