"use client";

import { useState, useEffect } from "react";
import { BarChart3, Globe, MessageSquare, FileText, Users, Server, ArrowLeft, TrendingUp } from "lucide-react";

interface PublicStats {
  totalDemandes: number;
  totalConversations: number;
  totalComptes: number;
  demandesParService: { service: string; count: number }[];
  convosParLangue: { langue: string; count: number }[];
  convosParIntent: { intent: string; count: number }[];
  convosParJour: { jour: string; count: number }[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1F5C99]/30 border-t-[#1F5C99] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  const totalConvos = stats?.convosParLangue?.reduce((s, r) => s + r.count, 0) || 1;
  const maxJour = Math.max(...(stats?.convosParJour?.map((d) => d.count) || [1]), 1);

  const INTENT_LABELS: Record<string, string> = {
    demande_document: "Demande de document",
    salutation: "Salutation",
    question_procedure: "Question procedure",
    question_lieu: "Localisation",
    question_cout: "Question cout",
    demande_inscription: "Inscription",
    suivi_demande: "Suivi de demande",
    default: "Non classifie",
  };

  const SERVICE_COLORS: Record<string, string> = {
    ETAT_CIVIL: "from-blue-500 to-blue-600",
    DGID: "from-orange-500 to-orange-600",
    CNSS: "from-red-500 to-red-600",
    EDUCATION: "from-green-500 to-green-600",
    SANTE: "from-purple-500 to-purple-600",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#e8f0fe]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1F5C99] to-[#0f3d6e] text-white px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <a href="/" className="p-2 hover:bg-white/10 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6" /> Statistiques SunuBot
            </h1>
            <p className="text-white/70 text-sm mt-0.5">
              Donnees d utilisation de la plateforme — mises a jour en temps reel
            </p>
          </div>
          <span className="text-xs text-white/50 hidden sm:block">
            {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Chiffres cles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Demandes traitees", value: stats?.totalDemandes || 0, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Conversations", value: stats?.totalConversations || 0, icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Utilisateurs", value: stats?.totalComptes || 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Serveurs MCP", value: "4/4", icon: Server, color: "text-green-600", bg: "bg-green-50" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-3xl font-black text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Activite 7 jours */}
        {stats?.convosParJour && stats.convosParJour.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1F5C99]" /> Activite des 7 derniers jours
            </h2>
            <div className="flex items-end gap-3 h-40">
              {stats.convosParJour.map((d) => {
                const pct = (d.count / maxJour) * 100;
                const jourLabel = new Date(d.jour + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
                return (
                  <div key={d.jour} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-700">{d.count}</span>
                    <div className="w-full bg-gray-100 rounded-xl relative" style={{ height: "120px" }}>
                      <div
                        className="absolute bottom-0 w-full bg-gradient-to-t from-[#1F5C99] to-[#60a5fa] rounded-xl transition-all"
                        style={{ height: `${Math.max(pct, 6)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">{jourLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Par langue */}
          {stats?.convosParLangue && stats.convosParLangue.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#1F5C99]" /> Langues utilisees
              </h2>
              <div className="space-y-4">
                {stats.convosParLangue.map((row) => {
                  const pct = Math.round((row.count / totalConvos) * 100);
                  const flags: Record<string, string> = { francais: "🇫🇷", wolof: "🇸🇳", mixte: "🌍" };
                  const colors: Record<string, string> = { francais: "from-blue-500 to-blue-600", wolof: "from-green-500 to-green-600", mixte: "from-purple-500 to-purple-600" };
                  return (
                    <div key={row.langue}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <span className="text-lg">{flags[row.langue] || "🌐"}</span>
                          <span className="capitalize">{row.langue}</span>
                        </span>
                        <span className="text-sm font-bold text-gray-800">{pct}% <span className="text-gray-400 font-normal text-xs">({row.count})</span></span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${colors[row.langue] || "from-gray-400 to-gray-500"} rounded-full transition-all`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Par service */}
          {stats?.demandesParService && stats.demandesParService.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1F5C99]" /> Demandes par service
              </h2>
              <div className="space-y-4">
                {stats.demandesParService.map((row) => {
                  const total = stats.totalDemandes || 1;
                  const pct = Math.round((row.count / total) * 100);
                  return (
                    <div key={row.service}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700">{row.service}</span>
                        <span className="text-sm font-bold text-gray-800">{pct}% <span className="text-gray-400 font-normal text-xs">({row.count})</span></span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${SERVICE_COLORS[row.service] || "from-gray-400 to-gray-500"} rounded-full transition-all`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Intentions detectees */}
        {stats?.convosParIntent && stats.convosParIntent.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#1F5C99]" /> Intentions detectees par le NLP
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.convosParIntent.map((row) => {
                const total = stats.convosParIntent!.reduce((s, r) => s + r.count, 0) || 1;
                const pct = Math.round((row.count / total) * 100);
                return (
                  <div key={row.intent} className="bg-gradient-to-br from-slate-50 to-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-[#1F5C99]">{pct}%</p>
                    <p className="text-[11px] text-gray-600 mt-1 font-medium">{INTENT_LABELS[row.intent] || row.intent}</p>
                    <p className="text-[10px] text-gray-400">{row.count} conversations</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6 text-xs text-gray-400">
          <p><strong>SunuBot</strong> — Plateforme de services administratifs intelligents du Senegal</p>
          <p className="mt-1">mBERT + Mistral + MCP | PostgreSQL 14 | Next.js 15 | Memoire M2 IA — Universite de Thies</p>
        </div>
      </main>
    </div>
  );
}
