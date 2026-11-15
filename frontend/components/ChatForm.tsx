"use client";

import { useState, useRef, useEffect } from "react";
import { Send, CheckCircle, FileText, Search, Upload, Clock, Coins, Download, RefreshCw } from "lucide-react";

interface FormField {
  id: string;
  label: string;
  label_wolof?: string;
  type: "text" | "date" | "select" | "tel" | "email" | "number" | "file";
  required: boolean;
  placeholder?: string;
  options?: string[];
  value?: string;
  accepte?: string;
}

export interface DocumentGuideInfo {
  titre: string;
  titre_wolof?: string;
  utilite: string[];
  utilite_wolof?: string[];
  delai: string;
  cout: string;
  etapes: Array<{ numero: number; titre: string; description: string }>;
  pieces_requises: Array<{ nom: string; nom_wolof?: string; obligatoire: boolean }>;
}

interface ChatFormProps {
  titre: string;
  titre_wolof?: string;
  fields: FormField[];
  onSubmit: (data: Record<string, string>) => void;
  isSubmitting?: boolean;
  langue?: string;
  guide?: DocumentGuideInfo;
}

export default function ChatForm({
  titre,
  titre_wolof,
  fields,
  onSubmit,
  isSubmitting,
  langue,
  guide,
}: ChatFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      initial[field.id] = field.value || "";
    }
    return initial;
  });
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, ...uploadedFiles });
  };

  const handleFileChange = (fieldId: string, file: File | null) => {
    if (file) {
      setUploadedFiles((prev) => ({ ...prev, [fieldId]: file.name }));
    }
  };

  const isWolof = langue === "wolof";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-hidden max-w-md">
      {/* Guide d'utilité du document */}
      {guide && (
        <div className="bg-green-50 border-b border-blue-100 px-5 py-4">
          <p className="text-[11px] font-semibold text-blue-800 mb-1.5">
            {isWolof ? "Ngir lan la soxor?" : "Pourquoi ce document ?"}
          </p>
          <ul className="space-y-0.5">
            {(isWolof && guide.utilite_wolof ? guide.utilite_wolof : guide.utilite).map((u, i) => (
              <li key={i} className="text-[11px] text-green-700 flex items-start gap-1">
                <span className="mt-0.5">•</span> {u}
              </li>
            ))}
          </ul>
          <div className="flex gap-3 mt-2">
            <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Clock className="w-3 h-3" /> {guide.delai}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
              <Coins className="w-3 h-3" /> {guide.cout}
            </span>
          </div>
        </div>
      )}

      {/* Étapes */}
      {guide && guide.etapes.length > 0 && (
        <div className="bg-gray-50 border-b border-gray-100 px-5 py-4">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
            {isWolof ? "Etapes yi" : "Étapes à suivre"}
          </p>
          <div className="space-y-2">
            {guide.etapes.map((e) => (
              <div key={e.numero} className="flex items-start gap-2.5">
                <span className="shrink-0 w-5 h-5 rounded-full bg-[#1F5C99] text-white text-[10px] flex items-center justify-center font-bold">{e.numero}</span>
                <div>
                  <p className="text-[11px] font-semibold text-gray-700">{e.titre}</p>
                  <p className="text-[10px] text-gray-500">{e.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pièces requises */}
      {guide && guide.pieces_requises.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-100 px-5 py-4">
          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-2">
            {isWolof ? "Papye yi nga war a indil" : "Pièces requises"}
          </p>
          <ul className="space-y-1">
            {guide.pieces_requises.map((p, i) => (
              <li key={i} className="text-[11px] text-amber-800 flex items-center gap-1.5">
                <span>{p.obligatoire ? "✓" : "○"}</span>
                {isWolof && p.nom_wolof ? p.nom_wolof : p.nom}
                {!p.obligatoire && <span className="text-[10px] text-amber-500 ml-1">({isWolof ? "du obligatoire" : "facultatif"})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-[#1F5C99] to-[#174a7a] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-white/20 rounded-xl p-1.5">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">{titre}</h3>
            {titre_wolof && (
              <p className="text-[10px] text-green-200 mt-0.5">{titre_wolof}</p>
            )}
          </div>
        </div>
      </div>

      {/* Form body */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {fields.map((field) => (
          <div key={field.id}>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1.5">
              {isWolof && field.label_wolof ? field.label_wolof : field.label}
              {field.required && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-[#1F5C99] border border-green-200 leading-none">
                  Requis
                </span>
              )}
            </label>
            {field.type === "select" ? (
              <select
                value={formData[field.id]}
                onChange={(e) =>
                  setFormData({ ...formData, [field.id]: e.target.value })
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#1F5C99] focus:ring-2 focus:ring-[#1F5C99]/20 bg-gray-50 transition-all duration-150"
                required={field.required}
              >
                <option value="">-- {isWolof ? "Tann" : "Choisir"} --</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : field.type === "file" ? (
              <div>
                <input
                  ref={(el) => { fileRefs.current[field.id] = el; }}
                  type="file"
                  accept={field.accepte || ".pdf,.jpg,.jpeg,.png"}
                  onChange={(e) => handleFileChange(field.id, e.target.files?.[0] || null)}
                  className="hidden"
                  id={`file-${field.id}`}
                />
                <label
                  htmlFor={`file-${field.id}`}
                  className="flex items-center gap-2 cursor-pointer w-full border border-dashed border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-gray-50 hover:bg-green-50 hover:border-[#1F5C99] transition-all duration-150"
                >
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 text-xs flex-1">
                    {uploadedFiles[field.id]
                      ? <span className="text-[#1F5C99] font-medium">{uploadedFiles[field.id]}</span>
                      : (isWolof ? "Jogg fichier bi (PDF, image)" : "Cliquer pour uploader (PDF, image)")}
                  </span>
                  {uploadedFiles[field.id] && <CheckCircle className="w-4 h-4 text-[#1F5C99]" />}
                </label>
              </div>
            ) : (
              <input
                type={field.type}
                value={formData[field.id]}
                onChange={(e) =>
                  setFormData({ ...formData, [field.id]: e.target.value })
                }
                placeholder={field.placeholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#1F5C99] focus:ring-2 focus:ring-[#1F5C99]/20 bg-gray-50 transition-all duration-150"
                required={field.required}
              />
            )}
          </div>
        ))}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-[#1F5C99] hover:bg-[#174a7a] text-white py-3 px-4 rounded-2xl text-sm font-semibold disabled:opacity-50 transition-all duration-200 shadow-lg mt-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isWolof ? "Yonnee ngi..." : "Envoi en cours..."}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {isWolof ? "Yonnee" : "Soumettre la demande"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// Composant pour afficher les infos d'un citoyen trouvé
interface CitoyenData {
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  nom_pere: string;
  nom_mere: string;
  numero_acte: string;
  commune: string;
  centre_etat_civil: string;
  [key: string]: string;
}

interface CitizenInfoProps {
  citoyen: CitoyenData;
  langue?: string;
  delai?: string;
  onConfirm?: () => void;
  onModifier?: () => void;
  isInscription?: boolean;
}

export function CitizenInfo({ citoyen, langue, delai, onConfirm, onModifier, isInscription }: CitizenInfoProps) {
  const isWolof = langue === "wolof";

  const rows = [
    { label: isWolof ? "Tur" : "Nom complet", value: `${citoyen.prenom} ${citoyen.nom}` },
    { label: isWolof ? "Bés bu juddu" : "Date de naissance", value: (() => { try { return new Date(citoyen.date_naissance).toLocaleDateString("fr-FR"); } catch { return citoyen.date_naissance; } })() },
    { label: isWolof ? "Fu juddu" : "Lieu de naissance", value: citoyen.lieu_naissance },
    { label: isWolof ? "Baay" : "Nom du père", value: citoyen.nom_pere },
    { label: isWolof ? "Yaay" : "Nom de la mère", value: citoyen.nom_mere },
    { label: isWolof ? "Telefon" : "Téléphone", value: citoyen.telephone || "—" },
  ];

  if (!isInscription) {
    rows.push(
      { label: isWolof ? "Numéro acte" : "N° acte", value: citoyen.numero_acte },
      { label: isWolof ? "Gox" : "Commune", value: citoyen.commune },
      { label: "Centre", value: citoyen.centre_etat_civil },
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-hidden max-w-md">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1F5C99] to-[#0f3d6e] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-white/20 rounded-xl p-1.5">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {isInscription
                ? (isWolof ? "Seetal sa informations yi" : "Vérification de vos informations")
                : (isWolof ? "Sa informations yi" : "Vos informations")}
            </h3>
            {isInscription && (
              <p className="text-white/70 text-[11px]">
                {isWolof ? "Xool ndax dafa jëm bu baax" : "Vérifiez avant de confirmer"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Champs */}
      <div className="p-5 space-y-2">
        {rows.map((row, i) => (
          <InfoRow key={i} label={row.label} value={row.value} />
        ))}

        {/* Boutons confirmation */}
        {onConfirm && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            {isInscription && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-[11px] text-blue-800 font-medium">
                  {isWolof
                    ? "ℹ️ Xool bu baax sa informations yi gannaaw bu ngay confirm. Su am njëkëtu, teral ci Modifier."
                    : "ℹ️ Vérifiez bien vos informations. Si une erreur est présente, cliquez sur Modifier."}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={onConfirm}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#1F5C99] to-[#0f3d6e] hover:opacity-90 text-white py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 shadow-md"
              >
                <CheckCircle className="w-4 h-4" />
                {isWolof ? "Waaw, confirm" : "Confirmer et soumettre"}
              </button>
              {onModifier && (
                <button
                  onClick={onModifier}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-150"
                >
                  ✏️ {isWolof ? "Soppi" : "Modifier"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Délai info */}
        {!onConfirm && delai && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs font-medium text-blue-800">
                {isWolof
                  ? `📅 Sa kàrt bi dina am ci ${delai}. Kaay jël ko ci ${citoyen.centre_etat_civil}.`
                  : `📅 Votre document sera prêt dans ${delai}. Lieu de retrait : ${citoyen.centre_etat_civil}.`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-50">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-800">{value}</span>
    </div>
  );
}

// Composant pour le résultat d'une soumission
interface SubmissionResultProps {
  numero_suivi: string;
  delai: string;
  lieu_retrait: string;
  langue?: string;
  // Données optionnelles pour générer le PDF récépissé
  pdfData?: {
    type: string;
    service: string;
    nom: string;
    prenom: string;
    telephone?: string;
    details?: Record<string, string>;
  };
}

const STATUT_STEPS = [
  { key: "recu", labelFr: "Reçu", labelWo: "Jot na" },
  { key: "en_cours", labelFr: "En cours", labelWo: "Ci kanam" },
  { key: "valide", labelFr: "Validé", labelWo: "Seet na" },
  { key: "disponible", labelFr: "Disponible", labelWo: "Jënd" },
];

export function SubmissionResult({ numero_suivi, delai, lieu_retrait, langue, pdfData }: SubmissionResultProps) {
  const isWolof = langue === "wolof";
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const { genererRecepissePDF } = await import("@/lib/pdf-generator");
      await genererRecepissePDF({
        reference: numero_suivi,
        type: pdfData?.type || "Demande administrative",
        service: pdfData?.service || "ETAT_CIVIL",
        nom: pdfData?.nom || "",
        prenom: pdfData?.prenom || "",
        telephone: pdfData?.telephone,
        dateCreation: new Date().toLocaleDateString("fr-FR"),
        statut: "recu",
        details: pdfData?.details,
        langue,
      });
      setDownloaded(true);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-hidden max-w-md">
      <div className="bg-gradient-to-r from-[#1F5C99] to-[#174a7a] px-5 py-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-white" />
          <h3 className="text-sm font-semibold text-white">
            {isWolof ? "Sa demande yonnee na!" : "Demande soumise avec succes !"}
          </h3>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Numéro de suivi */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
            {isWolof ? "Numéro suivi" : "Numero de suivi"}
          </p>
          <p className="text-lg font-bold text-green-700 font-mono">{numero_suivi}</p>
        </div>

        {/* Barre de progression du statut */}
        <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">
            {isWolof ? "Topp sa demande" : "Suivi de votre demande"}
          </p>
          <div className="flex items-center">
            {STATUT_STEPS.map((step, i) => (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    i === 0 ? "bg-green-600 text-white" : "bg-gray-200 text-gray-400"
                  }`}>
                    {i === 0 ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`text-[8px] mt-1 text-center leading-tight ${i === 0 ? "text-green-700 font-semibold" : "text-gray-400"}`}>
                    {isWolof ? step.labelWo : step.labelFr}
                  </span>
                </div>
                {i < STATUT_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 ${i === 0 ? "bg-green-200" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">{isWolof ? "Ñaata bés" : "Delai"} :</span>
            <span className="text-xs font-semibold text-gray-800">{delai}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">{isWolof ? "Fu la jël" : "Lieu de retrait"} :</span>
            <span className="text-xs font-semibold text-gray-800">{lieu_retrait}</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
          <p className="text-[10px] text-amber-700">
            {isWolof
              ? "Baal sa numéro suivi bi. Dinaa ko soxla ngir topp sa demande."
              : "Conservez ce numero de suivi. Il vous sera demande pour suivre votre demande."}
          </p>
        </div>

        {/* Bouton télécharger PDF */}
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 shadow-lg ${
            downloaded
              ? "bg-green-50 text-[#1F5C99] border border-green-200"
              : "bg-[#1F5C99] text-white hover:bg-[#174a7a]"
          } disabled:opacity-50`}
        >
          {isDownloading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : downloaded ? (
            <><CheckCircle className="w-4 h-4" /> {isWolof ? "PDF bi ngi dem!" : "PDF téléchargé !"}</>
          ) : (
            <><Download className="w-4 h-4" /> {isWolof ? "Télécharger récépissé PDF" : "Télécharger le récépissé PDF"}</>
          )}
        </button>
      </div>
    </div>
  );
}

// Composant recherche rapide
interface QuickSearchProps {
  onSearch: (query: string) => void;
  langue?: string;
  serviceAttendu?: "bourse" | "cnss" | "cmu" | "ninea" | null;
}

const SERVICE_PREFIXES: Record<string, string> = {
  bourse: "BRS-",
  cnss: "CSS-",
  cmu: "CMU-",
  ninea: "NIN-",
};

const SERVICE_LABELS: Record<string, { fr: string; wo: string }> = {
  bourse: { fr: "bourse (BRS-2024-001)", wo: "bourse (BRS-2024-001)" },
  cnss: { fr: "CNSS (CSS-2024-001)", wo: "CNSS (CSS-2024-001)" },
  cmu: { fr: "CMU (CMU-2024-001)", wo: "CMU (CMU-2024-001)" },
  ninea: { fr: "NINEA (NIN-2024-001)", wo: "NINEA (NIN-2024-001)" },
};

export function QuickSearch({ onSearch, langue, serviceAttendu }: QuickSearchProps) {
  const [query, setQuery] = useState("");
  const [erreur, setErreur] = useState("");
  const isWolof = langue === "wolof";

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;

    // Si un service est attendu, valider le préfixe
    if (serviceAttendu && SERVICE_PREFIXES[serviceAttendu]) {
      const prefixAttendu = SERVICE_PREFIXES[serviceAttendu];
      if (!q.toUpperCase().startsWith(prefixAttendu)) {
        const label = isWolof
          ? SERVICE_LABELS[serviceAttendu]?.wo
          : SERVICE_LABELS[serviceAttendu]?.fr;
        setErreur(
          isWolof
            ? `Sa numero bi warr tammbali ak ${prefixAttendu}. Exemple : ${label}`
            : `Ce numero doit commencer par ${prefixAttendu}. Exemple : ${label}`
        );
        return;
      }
    }
    setErreur("");
    onSearch(q);
  };

  const placeholder = serviceAttendu
    ? `Ex: ${SERVICE_PREFIXES[serviceAttendu] || ""}2024-001`
    : (isWolof ? "Sa tur walla numéro..." : "Nom ou numero...");

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-hidden max-w-md">
      <div className="bg-gradient-to-r from-[#1F5C99] to-[#174a7a] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-white/20 rounded-xl p-1.5">
            <Search className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-wide">
            {isWolof ? "Seetal sa kàrt" : "Rechercher votre document"}
          </h3>
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs text-gray-500 mb-3">
          {serviceAttendu
            ? (isWolof
                ? `Bind sa numéro ${SERVICE_LABELS[serviceAttendu]?.wo || ""}`
                : `Entrez votre numero de ${SERVICE_LABELS[serviceAttendu]?.fr || "service"}`)
            : (isWolof
                ? "Bind sa tur walla numéro acte bi (ex: N-2024-001-THI)"
                : "Entrez votre nom ou numero d'acte (ex: N-2024-001-THI)")}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setErreur(""); }}
            placeholder={placeholder}
            className={`flex-1 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-gray-50 transition-all duration-150 ${erreur ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-[#1F5C99] focus:ring-[#1F5C99]/20"}`}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          />
          <button
            onClick={handleSearch}
            className="bg-[#1F5C99] hover:bg-[#174a7a] text-white px-4 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-md"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
        {erreur && (
          <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
            <span>⚠</span> {erreur}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Suivi de demande en temps réel ──────────────────────────────

interface SuiviDemandeProps {
  numeroDemande: string;
  langue?: string;
}

export function SuiviDemande({ numeroDemande, langue }: SuiviDemandeProps) {
  const isWolof = langue === "wolof";
  const [demande, setDemande] = useState<{
    numero_suivi: string; nom: string; prenom: string;
    type_document: string; statut: string; statut_label: string;
    date_soumission: string; date_prevue: string; lieu_retrait: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchSuivi = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/formulaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suivre", numero_suivi: numeroDemande }),
      });
      const data = await res.json();
      if (data.success) { setDemande(data.demande); setErreur(""); }
      else setErreur(isWolof ? "Demande bi gisuma." : "Demande introuvable.");
    } catch { setErreur("Erreur de connexion."); }
    finally { setLoading(false); setLastRefresh(new Date()); }
  };

  useEffect(() => {
    fetchSuivi();
    const interval = setInterval(fetchSuivi, 30000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  const ETAPES = [
    { key: "soumise",       labelFr: "Recue",      labelWo: "Jot na",  icon: "1" },
    { key: "en_traitement", labelFr: "En cours",   labelWo: "Ci jef",  icon: "2" },
    { key: "prete",         labelFr: "Disponible", labelWo: "Am na",   icon: "3" },
    { key: "retiree",       labelFr: "Retiree",    labelWo: "Jel na",  icon: "4" },
  ];
  const etapeIndex = ETAPES.findIndex(e => e.key === demande?.statut);
  const statutColors: Record<string, string> = {
    soumise: "bg-blue-100 text-blue-700", en_traitement: "bg-yellow-100 text-yellow-700",
    prete: "bg-green-100 text-green-700", retiree: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-hidden max-w-md">
      <div className="bg-gradient-to-r from-[#1F5C99] to-[#0f3d6e] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-white/20 rounded-xl p-1.5"><Clock className="w-4 h-4 text-white" /></div>
          <div>
            <h3 className="text-sm font-bold text-white">{isWolof ? "Topp sa demande" : "Suivi de votre demande"}</h3>
            <p className="text-white/60 text-[10px] font-mono">{numeroDemande}</p>
          </div>
        </div>
        <button onClick={fetchSuivi} disabled={loading} className="text-white/60 hover:text-white transition">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="p-5">
        {loading && !demande ? (
          <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">{isWolof ? "Yegel..." : "Chargement..."}</span>
          </div>
        ) : erreur ? (
          <p className="text-sm text-red-500 text-center py-4">{erreur}</p>
        ) : demande ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{isWolof ? "Tur" : "Demandeur"}</p>
                <p className="text-sm font-bold text-gray-800">{demande.prenom} {demande.nom}</p>
                <p className="text-[11px] text-[#1F5C99]">{demande.type_document?.replace(/_/g, " ")}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${statutColors[demande.statut] || "bg-gray-100 text-gray-600"}`}>
                {isWolof ? ETAPES.find(e => e.key === demande.statut)?.labelWo : demande.statut_label?.split(" - ")[0]}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-3">
                {isWolof ? "Yoon bi" : "Progression"}
              </p>
              <div className="flex items-center">
                {ETAPES.map((etape, i) => {
                  const done = i <= etapeIndex;
                  const active = i === etapeIndex;
                  return (
                    <div key={etape.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${active ? "bg-[#1F5C99] text-white shadow-lg ring-4 ring-blue-100" : done ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                          {done && !active ? "OK" : etape.icon}
                        </div>
                        <span className={`text-[9px] mt-1.5 text-center leading-tight max-w-[50px] font-medium ${active ? "text-[#1F5C99]" : done ? "text-green-600" : "text-gray-400"}`}>
                          {isWolof ? etape.labelWo : etape.labelFr}
                        </span>
                      </div>
                      {i < ETAPES.length - 1 && (
                        <div className={`flex-1 h-1 mx-1 mb-5 rounded-full ${i < etapeIndex ? "bg-green-400" : "bg-gray-200"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {[
                { label: isWolof ? "Bes bu yonnee" : "Soumis le", value: demande.date_soumission },
                { label: isWolof ? "Bes bu am" : "Date prevue", value: demande.date_prevue },
                { label: isWolof ? "Fu la jel ko" : "Lieu de retrait", value: demande.lieu_retrait },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-[11px] text-gray-500">{row.label}</span>
                  <span className="text-[11px] font-semibold text-gray-800">{row.value}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-300 text-right">
              {isWolof ? "Yeesal ci" : "Actualise a"} {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              {" · "}
              <button onClick={fetchSuivi} className="underline hover:text-gray-500 transition">
                {isWolof ? "Yeesal" : "Actualiser"}
              </button>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
