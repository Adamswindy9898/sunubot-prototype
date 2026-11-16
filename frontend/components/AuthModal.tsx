"use client";

import { useState } from "react";
import { X, User, Lock, Mail, Phone, Eye, EyeOff, LogIn, UserPlus, Download } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (compte: ComptePublic, token: string) => void;
  langue?: string;
}

export interface ComptePublic {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateInscription: string;
  numeroActe?: string;
  demandes: DemandeHistorique[];
}

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

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  recu: { label: "Reçu", color: "bg-blue-100 text-blue-700" },
  en_cours: { label: "En cours", color: "bg-yellow-100 text-yellow-700" },
  valide: { label: "Validé", color: "bg-green-100 text-green-700" },
  rejete: { label: "Rejeté", color: "bg-red-100 text-red-700" },
  disponible: { label: "Disponible ✓", color: "bg-emerald-100 text-emerald-700" },
};

export default function AuthModal({ onClose, onSuccess, langue }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const isWolof = langue === "wolof";

  const [form, setForm] = useState({
    nom: "", prenom: "", email: "", telephone: "", password: "", confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErreur("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErreur("");

    try {
      if (mode === "register") {
        if (form.password !== form.confirmPassword) {
          setErreur("Les mots de passe ne correspondent pas.");
          setIsLoading(false);
          return;
        }
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nom: form.nom, prenom: form.prenom,
            email: form.email, telephone: form.telephone, password: form.password,
          }),
        });
        const data = await res.json();
        if (!data.success) { setErreur(data.error); setIsLoading(false); return; }
        // Auto-login après inscription
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const loginData = await loginRes.json();
        if (loginData.success) onSuccess(loginData.compte, loginData.token);
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!data.success) { setErreur(data.error); setIsLoading(false); return; }
        onSuccess(data.compte, data.token);
      }
    } catch {
      setErreur("Erreur de connexion. Veuillez reessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1F5C99] to-[#174a7a] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">
              {mode === "login"
                ? (isWolof ? "Dugg ci SunuBot" : "Connexion à SunuBot")
                : (isWolof ? "Bind sa compte" : "Créer votre compte")}
            </h2>
            <p className="text-white/70 text-xs mt-0.5">
              {isWolof ? "Accès sécurisé à vos services" : "Accès sécurisé à vos services"}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-1 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition ${mode === "login" ? "text-[#1F5C99] border-b-2 border-[#1F5C99]" : "text-gray-500 hover:text-gray-700"}`}
          >
            <LogIn className="w-4 h-4" />
            {isWolof ? "Dugg" : "Connexion"}
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition ${mode === "register" ? "text-[#1F5C99] border-b-2 border-[#1F5C99]" : "text-gray-500 hover:text-gray-700"}`}
          >
            <UserPlus className="w-4 h-4" />
            {isWolof ? "Bind compte" : "Inscription"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Nom *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input name="nom" value={form.nom} onChange={handleChange} required
                    placeholder="DIOP" className="w-full pl-9 pr-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1F5C99] focus:ring-2 focus:ring-[#1F5C99]/20" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Prénom *</label>
                <input name="prenom" value={form.prenom} onChange={handleChange} required
                  placeholder="Moussa" className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1F5C99] focus:ring-2 focus:ring-[#1F5C99]/20" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input name="email" type="email" value={form.email} onChange={handleChange} required
                placeholder="vous@example.com" className="w-full pl-9 pr-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1F5C99] focus:ring-2 focus:ring-[#1F5C99]/20" />
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Téléphone *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input name="telephone" type="tel" value={form.telephone} onChange={handleChange} required
                  placeholder="77 123 45 67" className="w-full pl-9 pr-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1F5C99] focus:ring-2 focus:ring-[#1F5C99]/20" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Mot de passe *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} required
                placeholder="••••••" className="w-full pl-9 pr-10 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1F5C99] focus:ring-2 focus:ring-[#1F5C99]/20" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Confirmer le mot de passe *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input name="confirmPassword" type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={handleChange} required
                  placeholder="••••••" className="w-full pl-9 pr-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1F5C99] focus:ring-2 focus:ring-[#1F5C99]/20" />
              </div>
            </div>
          )}

          {erreur && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              ⚠ {erreur}
            </p>
          )}

          <button type="submit" disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#1F5C99] to-[#174a7a] text-white py-3 rounded-xl text-sm font-semibold shadow-lg hover:from-[#174a7a] hover:to-[#124028] disabled:opacity-50 transition flex items-center justify-center gap-2">
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === "login" ? (
              <><LogIn className="w-4 h-4" /> {isWolof ? "Dugg" : "Se connecter"}</>
            ) : (
              <><UserPlus className="w-4 h-4" /> {isWolof ? "Bind" : "Créer mon compte"}</>
            )}
          </button>

          {mode === "login" && (
            <p className="text-center text-xs text-gray-500">
              Compte de test : <span className="font-mono text-[#1F5C99]">moussa.diop@example.com</span> / <span className="font-mono text-[#1F5C99]">password123</span>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

// Composant tableau de bord citoyen
interface DashboardProps {
  compte: ComptePublic;
  onClose: () => void;
  onLogout: () => void;
  langue?: string;
}

export function Dashboard({ compte, onClose, onLogout, langue }: DashboardProps) {
  const isWolof = langue === "wolof";
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPDF = async (d: DemandeHistorique) => {
    setDownloadingId(d.id);
    try {
      const { genererRecepissePDF } = await import("@/lib/pdf-generator");
      await genererRecepissePDF({
        reference: d.reference,
        type: d.type,
        service: d.service,
        nom: compte.nom,
        prenom: compte.prenom,
        telephone: compte.telephone,
        dateCreation: d.dateCreation,
        statut: d.statut,
        details: d.details,
        langue,
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1F5C99] to-[#174a7a] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-sm ring-2 ring-white/30">
              {compte.prenom[0]}{compte.nom[0]}
            </div>
            <div>
              <p className="text-white font-semibold">{compte.prenom} {compte.nom}</p>
              <p className="text-white/70 text-xs">{compte.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onLogout}
              className="text-white/70 hover:text-white text-xs border border-white/30 hover:border-white/60 px-3 py-1.5 rounded-lg transition">
              {isWolof ? "Dem" : "Déconnexion"}
            </button>
            <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-1 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profil */}
        <div className="px-6 py-3 bg-green-50 border-b border-blue-100 flex gap-4 text-xs">
          <span className="text-gray-600">📞 {compte.telephone}</span>
          <span className="text-gray-600">📅 Inscrit le {compte.dateInscription}</span>
          {compte.numeroActe && <span className="text-[#1F5C99] font-mono font-medium">📄 {compte.numeroActe}</span>}
        </div>

        {/* Historique des demandes */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Notifications in-app */}
          {(() => {
            const today = new Date().toISOString().split("T")[0];
            const recentUpdates = compte.demandes.filter(
              (d) => d.dateMiseAJour !== d.dateCreation && d.dateMiseAJour >= today
            );
            const disponibles = compte.demandes.filter((d) => d.statut === "disponible");
            if (recentUpdates.length === 0 && disponibles.length === 0) return null;
            return (
              <div className="mb-4 space-y-2">
                {disponibles.map((d) => (
                  <div key={`notif-${d.id}`} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl animate-pulse">
                    <span className="text-lg">✅</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-green-800">
                        {isWolof ? "Sa document amna!" : "Votre document est prêt !"}
                      </p>
                      <p className="text-[10px] text-green-600">{d.type} — {d.reference}</p>
                    </div>
                  </div>
                ))}
                {recentUpdates.filter((d) => d.statut !== "disponible").map((d) => (
                  <div key={`notif-upd-${d.id}`} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <span className="text-lg">🔔</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-blue-800">
                        {isWolof ? "Yeesal" : "Mise à jour"} — {d.reference}
                      </p>
                      <p className="text-[10px] text-blue-600">
                        {isWolof ? "Statut : " : "Nouveau statut : "}
                        <span className="font-bold">{STATUT_LABELS[d.statut]?.label || d.statut}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            📋 {isWolof ? "Sa demandes yi" : "Mes demandes"}
            <span className="bg-[#1F5C99] text-white text-[10px] px-2 py-0.5 rounded-full">{compte.demandes.length}</span>
          </h3>

          {compte.demandes.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              {isWolof ? "Amul demande rekk" : "Aucune demande pour le moment"}
            </p>
          ) : (
            <div className="space-y-4">
              {compte.demandes.slice().reverse().map((d) => {
                const st = STATUT_LABELS[d.statut] || { label: d.statut, color: "bg-gray-100 text-gray-600" };
                const steps = [
                  { key: "recu", label: isWolof ? "Jotna" : "Reçu", icon: "📥" },
                  { key: "en_cours", label: isWolof ? "Ngi ci" : "En cours", icon: "⏳" },
                  { key: "valide", label: isWolof ? "Validé" : "Validé", icon: "✅" },
                  { key: "disponible", label: isWolof ? "Amna" : "Disponible", icon: "📄" },
                ];
                const currentIdx = steps.findIndex((s) => s.key === d.statut);
                const isRejected = d.statut === "rejete";

                return (
                  <div key={d.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
                    {/* Header demande */}
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-4 py-3 flex items-start justify-between gap-2 border-b border-gray-100">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">{d.type}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-500 font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">{d.reference}</span>
                          <span className="text-[10px] text-gray-400">{d.service}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold shrink-0 ${st.color}`}>
                        {st.label}
                      </span>
                    </div>

                    {/* Timeline visuelle */}
                    <div className="px-4 py-3">
                      {isRejected ? (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5">
                          <span className="text-lg">❌</span>
                          <div>
                            <p className="text-xs font-semibold text-red-700">{isWolof ? "Demande bi rejetéena" : "Demande rejetée"}</p>
                            <p className="text-[10px] text-red-500">{d.dateMiseAJour}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          {steps.map((step, i) => {
                            const isDone = i <= currentIdx;
                            const isCurrent = i === currentIdx;
                            return (
                              <div key={step.key} className="flex items-center flex-1">
                                {/* Étape */}
                                <div className="flex flex-col items-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                                    isCurrent
                                      ? "bg-[#1F5C99] text-white ring-4 ring-blue-100 shadow-md"
                                      : isDone
                                      ? "bg-green-500 text-white"
                                      : "bg-gray-100 text-gray-400"
                                  }`}>
                                    {isDone && !isCurrent ? "✓" : step.icon}
                                  </div>
                                  <span className={`text-[9px] mt-1 font-medium text-center leading-tight ${
                                    isCurrent ? "text-[#1F5C99] font-bold" : isDone ? "text-green-600" : "text-gray-400"
                                  }`}>
                                    {step.label}
                                  </span>
                                </div>
                                {/* Ligne entre les étapes */}
                                {i < steps.length - 1 && (
                                  <div className={`flex-1 h-0.5 mx-1 rounded-full ${
                                    i < currentIdx ? "bg-green-400" : "bg-gray-200"
                                  }`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Dates + Actions */}
                    <div className="px-4 pb-3 flex items-center justify-between">
                      <div className="flex gap-3 text-[10px] text-gray-400">
                        <span>📅 {isWolof ? "Bind" : "Créé"} : {d.dateCreation}</span>
                        <span>🔄 {isWolof ? "Yeesal" : "MAJ"} : {d.dateMiseAJour}</span>
                      </div>
                      <button
                        onClick={() => handleDownloadPDF(d)}
                        disabled={downloadingId === d.id}
                        className="flex items-center gap-1 text-[10px] font-semibold text-[#1F5C99] border border-[#1F5C99]/30 hover:bg-blue-50 rounded-lg px-2.5 py-1.5 transition disabled:opacity-50"
                      >
                        {downloadingId === d.id
                          ? <span className="w-3 h-3 border border-[#1F5C99]/30 border-t-[#1F5C99] rounded-full animate-spin" />
                          : <Download className="w-3 h-3" />}
                        PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
