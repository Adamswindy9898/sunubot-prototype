// Script de seed — données de démonstration pour SunuBot
// Lancer avec : npx ts-node prisma/seed.ts  OU  npx prisma db seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding SunuBot database...");

  // ─── Compte citoyen de démonstration ──────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 10);

  const moussa = await prisma.compte.upsert({
    where: { email: "moussa.diop@example.com" },
    update: {},
    create: {
      nom: "DIOP",
      prenom: "Moussa",
      email: "moussa.diop@example.com",
      telephone: "77 000 00 00",
      passwordHash,
      dateInscription: "2024-01-15",
      numeroActe: "N-2024-001-DKR",
    },
  });
  console.log("✅ Compte Moussa DIOP créé");

  const fatou = await prisma.compte.upsert({
    where: { email: "fatou.fall@example.com" },
    update: {},
    create: {
      nom: "FALL",
      prenom: "Fatou",
      email: "fatou.fall@example.com",
      telephone: "76 111 11 11",
      passwordHash,
      dateInscription: "2024-03-20",
    },
  });
  console.log("✅ Compte Fatou FALL créé");

  // ─── Citoyens ──────────────────────────────────────────────────────────────
  await prisma.citoyen.upsert({
    where: { numero_acte: "N-2024-001-DKR" },
    update: {},
    create: {
      numero_acte: "N-2024-001-DKR",
      nom: "DIOP",
      prenom: "Moussa",
      date_naissance: "1990-05-15",
      lieu_naissance: "Thiès",
      nom_pere: "DIOP Ibrahima",
      nom_mere: "FALL Fatou",
      telephone: "77 000 00 00",
      commune: "Commune de Thiès",
      centre_etat_civil: "Centre d'état civil de Thiès",
    },
  });

  await prisma.citoyen.upsert({
    where: { numero_acte: "N-2024-002-DKR" },
    update: {},
    create: {
      numero_acte: "N-2024-002-DKR",
      nom: "FALL",
      prenom: "Fatou",
      date_naissance: "1995-08-22",
      lieu_naissance: "Dakar",
      nom_pere: "FALL Aliou",
      nom_mere: "DIALLO Mariama",
      telephone: "76 111 11 11",
      commune: "Commune de Dakar",
      centre_etat_civil: "Centre d'état civil de Dakar Plateau",
    },
  });
  await prisma.citoyen.upsert({
    where: { numero_acte: "N-2024-003-STL" },
    update: {},
    create: {
      numero_acte: "N-2024-003-STL",
      nom: "SOW",
      prenom: "Abdoulaye",
      date_naissance: "1988-12-01",
      lieu_naissance: "Saint-Louis",
      nom_pere: "SOW Mamadou",
      nom_mere: "BA Aissatou",
      telephone: "76 222 33 44",
      commune: "Saint-Louis",
      centre_etat_civil: "Centre d'Etat Civil de Saint-Louis",
    },
  });

  await prisma.citoyen.upsert({
    where: { numero_acte: "N-2024-004-THI" },
    update: {},
    create: {
      numero_acte: "N-2024-004-THI",
      nom: "NDIAYE",
      prenom: "Aminata",
      date_naissance: "2000-07-22",
      lieu_naissance: "Thiès",
      nom_pere: "NDIAYE Ousmane",
      nom_mere: "SARR Khady",
      telephone: "78 456 78 90",
      commune: "Thiès-Nord",
      centre_etat_civil: "Centre Principal de Thiès",
    },
  });

  await prisma.citoyen.upsert({
    where: { numero_acte: "N-2024-005-KAO" },
    update: {},
    create: {
      numero_acte: "N-2024-005-KAO",
      nom: "BA",
      prenom: "Oumar",
      date_naissance: "1992-09-18",
      lieu_naissance: "Kaolack",
      nom_pere: "BA Cheikh",
      nom_mere: "DIOP Ndeye",
      telephone: "70 234 56 78",
      commune: "Kaolack",
      centre_etat_civil: "Centre d'Etat Civil de Kaolack",
    },
  });
  console.log("✅ Citoyens créés (5)");

  // ─── Demandes de Moussa ────────────────────────────────────────────────────
  await prisma.demande.upsert({
    where: { reference: "DEM-2024-001" },
    update: {},
    create: {
      reference: "DEM-2024-001",
      type: "Demande d'acte de naissance",
      service: "ETAT_CIVIL",
      statut: "VALIDE",
      details: JSON.stringify({ commune: "Thiès", copies: "2" }),
      dateCreation: "2024-02-10",
      dateMiseAJour: "2024-02-12",
      compteId: moussa.id,
    },
  });

  await prisma.demande.upsert({
    where: { reference: "NIN-2024-001" },
    update: {},
    create: {
      reference: "NIN-2024-001",
      type: "Immatriculation NINEA",
      service: "DGID",
      statut: "DISPONIBLE",
      details: JSON.stringify({ activite: "Commerce général", type: "Personne physique" }),
      dateCreation: "2024-03-10",
      dateMiseAJour: "2024-03-12",
      compteId: moussa.id,
    },
  });

  // ─── Demande de Fatou ─────────────────────────────────────────────────────
  await prisma.demande.upsert({
    where: { reference: "CSS-2024-001" },
    update: {},
    create: {
      reference: "CSS-2024-001",
      type: "Inscription CNSS",
      service: "CNSS",
      statut: "EN_COURS",
      details: JSON.stringify({ type: "salarie", employeur: "Sénégal Industries SA" }),
      dateCreation: "2024-04-05",
      dateMiseAJour: "2024-04-06",
      compteId: fatou.id,
    },
  });
  console.log("✅ Demandes créées");

  // ─── Enregistrements services ─────────────────────────────────────────────
  await prisma.serviceRecord.upsert({
    where: { reference: "NIN-2024-001" },
    update: {},
    create: {
      type: "dgid",
      reference: "NIN-2024-001",
      nom: "DIOP",
      prenom: "Moussa",
      telephone: "77 000 00 00",
      data: JSON.stringify({
        ninea: "NIN-2024-001",
        nom_entreprise: "DIOP Trading",
        activite: "Commerce général",
        regime_fiscal: "Réel simplifié",
        centre_fiscal: "Centre fiscal de Thiès",
        adresse: "Marché central, Thiès",
        chiffre_affaires: "5 000 000 FCFA/an",
        statut: "Actif",
      }),
    },
  });

  await prisma.serviceRecord.upsert({
    where: { reference: "CSS-2024-001" },
    update: {},
    create: {
      type: "cnss",
      reference: "CSS-2024-001",
      nom: "FALL",
      prenom: "Fatou",
      telephone: "76 111 11 11",
      data: JSON.stringify({
        numero_cnss: "CSS-2024-001",
        type: "salarie",
        secteur: "Industrie",
        employeur: "Sénégal Industries SA",
        prestations: ["Allocations familiales", "Accident travail", "Retraite"],
        statut: "Actif",
      }),
    },
  });

  await prisma.serviceRecord.upsert({
    where: { reference: "BRS-2024-001" },
    update: {},
    create: {
      type: "bourse",
      reference: "BRS-2024-001",
      nom: "SOW",
      prenom: "Ibrahima",
      telephone: "78 222 22 22",
      data: JSON.stringify({
        numero_bourse: "BRS-2024-001",
        universite: "Université de Thiès",
        filiere: "Informatique / IA",
        niveau: "Master 2",
        montant_mensuel: "45 000 FCFA",
        statut: "Active",
      }),
    },
  });

  await prisma.serviceRecord.upsert({
    where: { reference: "CMU-2024-001" },
    update: {},
    create: {
      type: "cmu",
      reference: "CMU-2024-001",
      nom: "NDIAYE",
      prenom: "Aissatou",
      telephone: "77 333 33 33",
      data: JSON.stringify({
        numero_cmu: "CMU-2024-001",
        type_menage: "Famille (4 personnes)",
        membres_couverts: 4,
        mutuelle: "Mutuelle de santé de Thiès",
        cotisation_annuelle: "15 000 FCFA",
        statut: "Active",
      }),
    },
  });
  console.log("✅ Enregistrements services créés");

  console.log("\n🎉 Base de données seeded avec succès !");
  console.log("   Compte de test : moussa.diop@example.com / password123");
  console.log("   Compte de test : fatou.fall@example.com  / password123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
