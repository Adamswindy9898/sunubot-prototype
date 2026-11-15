"use client";

// Génération PDF côté client avec jsPDF v4
// jsPDF v4 exporte la classe comme export default

export interface RecepissePDFData {
  reference: string;
  type: string;
  service: string;
  nom: string;
  prenom: string;
  telephone?: string;
  dateCreation: string;
  statut: "recu" | "en_cours" | "valide" | "rejete" | "disponible";
  details?: Record<string, string>;
  langue?: string;
}

const STATUT_FR: Record<string, string> = {
  recu: "Recu — En attente",
  en_cours: "En cours de traitement",
  valide: "Valide — Finalisation",
  rejete: "Rejete",
  disponible: "Disponible — A retirer",
};

const SERVICE_INFO: Record<string, { fr: string; logo: string; couleur: string }> = {
  CNSS:       { fr: "Caisse Nationale de Securite Sociale", logo: "CNSS", couleur: "#C0392B" },
  DGID:       { fr: "Direction Generale des Impots et Domaines", logo: "DGID", couleur: "#E67E22" },
  NINEA:      { fr: "Registre National des Entreprises (NINEA)", logo: "NINEA", couleur: "#D35400" },
  EDUCATION:  { fr: "Ministere de l'Education Nationale", logo: "MEN", couleur: "#27AE60" },
  SANTE:      { fr: "Ministere de la Sante (CMU)", logo: "CMU", couleur: "#8E44AD" },
  ETAT_CIVIL: { fr: "Direction de l'Etat Civil", logo: "EC", couleur: "#2980B9" },
  BOURSE:     { fr: "Bourse d'Etudes Nationales", logo: "MEN", couleur: "#27AE60" },
  CMU:        { fr: "Couverture Maladie Universelle", logo: "CMU", couleur: "#8E44AD" },
};

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [31, 92, 153];
}

function statutColor(s: string): [number, number, number] {
  const map: Record<string, [number, number, number]> = {
    recu:       [41, 128, 185],
    en_cours:   [243, 156, 18],
    valide:     [39, 174, 96],
    rejete:     [192, 57, 43],
    disponible: [22, 160, 133],
  };
  return map[s] || [100, 100, 100];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = any;

function sectionTitle(doc: Doc, title: string, x: number, y: number, w: number) {
  doc.setFillColor(31, 92, 153);
  doc.rect(x, y, w, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(title, x + 4, y + 5);
}

function tableRows(doc: Doc, rows: string[][], x: number, y: number, w: number): number {
  rows.forEach(([label, value], i) => {
    const ry = y + i * 9;
    const shade = i % 2 === 0 ? 250 : 255;
    doc.setFillColor(shade, shade, shade);
    doc.rect(x, ry, w, 8, "F");
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.rect(x, ry, w, 8, "D");
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(label, x + 3, ry + 5.5);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text(value || "—", x + w / 2, ry + 5.5);
  });
  return y + rows.length * 9;
}

export async function genererRecepissePDF(data: RecepissePDFData): Promise<void> {
  const jsPDFModule = await import("jspdf");
  // jsPDF v4 : export default
  const JsPDF = (jsPDFModule as unknown as { default: new (opts: object) => Doc }).default;
  const doc: Doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const svcKey = data.service.toUpperCase();
  const svc = SERVICE_INFO[svcKey] || { fr: data.service, logo: data.service, couleur: "#1F5C99" };
  const pageW = 210;
  const margin = 18;
  const contentW = pageW - margin * 2;

  // Bandeau supérieur
  doc.setFillColor(31, 92, 153);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("REPUBLIQUE DU SENEGAL", margin, 10);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Un Peuple — Un But — Une Foi", margin, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("SunuBot — Services Administratifs Numeriques", pageW - margin, 10, { align: "right" });
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("Assistant multilingue Francais / Wolof", pageW - margin, 16, { align: "right" });

  // Titre
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 28, pageW, 18, "F");
  doc.setTextColor(31, 92, 153);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("RECEPISSE DE DEMANDE", pageW / 2, 39, { align: "center" });

  // Bandeau service
  const [sr, sg, sb] = hexToRgb(svc.couleur);
  doc.setFillColor(sr, sg, sb);
  doc.rect(0, 46, pageW, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`${svc.logo} — ${svc.fr}`, pageW / 2, 52.5, { align: "center" });

  // Référence
  let y = 66;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(31, 92, 153);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentW, 22, 3, 3, "FD");
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("NUMERO DE REFERENCE", margin + 8, y + 7);
  doc.setTextColor(31, 92, 153);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(data.reference, margin + 8, y + 16);

  // Badge statut
  const statutText = STATUT_FR[data.statut] || data.statut;
  const [cr, cg, cb] = statutColor(data.statut);
  doc.setFillColor(cr, cg, cb);
  doc.roundedRect(pageW - margin - 60, y + 5, 60, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(statutText, pageW - margin - 30, y + 12.5, { align: "center" });

  // Informations demandeur
  y += 30;
  sectionTitle(doc, "INFORMATIONS DU DEMANDEUR", margin, y, contentW);
  y += 10;
  const infoRows: string[][] = [
    ["Nom complet", `${data.prenom} ${data.nom}`],
    ["Type de demande", data.type],
    ["Service concerne", svc.fr],
    ["Date de depot", data.dateCreation],
    ...(data.telephone ? [["Telephone", data.telephone]] : []),
  ];
  y = tableRows(doc, infoRows, margin, y, contentW);

  // Détails
  if (data.details && Object.keys(data.details).length > 0) {
    y += 6;
    sectionTitle(doc, "DETAILS DE LA DEMANDE", margin, y, contentW);
    y += 10;
    const detailRows = Object.entries(data.details).filter(([, v]) => v).map(([k, v]) => [k, v]);
    if (detailRows.length > 0) y = tableRows(doc, detailRows, margin, y, contentW);
  }

  // Barre de progression
  y += 8;
  sectionTitle(doc, "SUIVI DE TRAITEMENT", margin, y, contentW);
  y += 12;
  const steps = [
    { key: "recu", label: "Recu" },
    { key: "en_cours", label: "En cours" },
    { key: "valide", label: "Valide" },
    { key: "disponible", label: "Disponible" },
  ];
  const currentIdx = steps.findIndex((s) => s.key === data.statut);
  const stepW = contentW / steps.length;
  steps.forEach((step, i) => {
    const sx = margin + i * stepW;
    const active = i <= currentIdx && data.statut !== "rejete";
    const isCurrent = i === currentIdx;
    doc.setFillColor(active ? sr : 220, active ? sg : 220, active ? sb : 220);
    doc.circle(sx + stepW / 2, y, isCurrent ? 5 : 4, "F");
    if (i < steps.length - 1) {
      doc.setDrawColor(active && i < currentIdx ? sr : 200, active && i < currentIdx ? sg : 200, active && i < currentIdx ? sb : 200);
      doc.setLineWidth(1);
      doc.line(sx + stepW / 2 + 5, y, sx + stepW + stepW / 2 - 5, y);
    }
    doc.setTextColor(active ? 31 : 150, active ? 92 : 150, active ? 153 : 150);
    doc.setFont("helvetica", isCurrent ? "bold" : "normal");
    doc.setFontSize(7.5);
    doc.text(step.label, sx + stepW / 2, y + 8, { align: "center" });
  });

  // Instructions
  y += 20;
  doc.setFillColor(235, 245, 255);
  doc.setDrawColor(31, 92, 153);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentW, 28, 2, 2, "FD");
  doc.setTextColor(31, 92, 153);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("INSTRUCTIONS IMPORTANTES", margin + 4, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(7.5);
  [
    "Conservez ce recepisse — il fait office de preuve de depot de votre demande.",
    "Votre numero de reference vous permettra de suivre l'etat d'avancement.",
    "Pour tout renseignement, presentez-vous avec ce document et une piece d'identite.",
    "Delai de traitement indicatif : 3 a 15 jours ouvrables selon le service.",
  ].forEach((line, i) => doc.text(`• ${line}`, margin + 4, y + 14 + i * 5));

  // Pied de page
  const footerY = 277;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageW - margin, footerY);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.text(
    `Document genere le ${data.dateCreation} par SunuBot — Assistant Administratif Multilingue (FR/Wolof) — Memoire M2 IA`,
    pageW / 2, footerY + 5, { align: "center" }
  );
  doc.text(
    "Ce document est un recepisse electronique. Il ne remplace pas les documents officiels delivres par l'administration.",
    pageW / 2, footerY + 10, { align: "center" }
  );

  doc.save(`sunubot-recepisse-${data.reference.replace(/[\\/]/g, "-")}.pdf`);
}
