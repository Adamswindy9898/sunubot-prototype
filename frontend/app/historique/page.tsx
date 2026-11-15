"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowLeft,
  MessageSquare,
  Globe,
  Clock,
  Filter,
  BarChart3,
  Search,
} from "lucide-react";
import Link from "next/link";

interface ConversationEntry {
  id: string;
  message: string;
  langue: string;
  intent: string | null;
  domaine: string | null;
  compteId: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  par_langue: { langue: string; count: number }[];
  par_intent: { intent: string; count: number }[];
}

const INTENT_LABELS: Record<string, string> = {
  salutation: "Salutation",
  demande_document: "Demande de document",
  question_procedure: "Question procédure",
  question_lieu: "Localisation",
  question_cout: "Question coût",
  demande_inscription: "Inscription",
  suivi_demande: "Suivi demande",
  question_delai: "Question délai",
  inconnu: "Non classifié",
};

const INTENT_COLORS: Record<string, string> = {
  salutation: "bg-green-100 text-green-800",
  demande_document: "bg-blue-100 text-blue-800",
  question_procedure: "bg-purple-100 text-purple-800",
  question_lieu: "bg-amber-100 text-amber-800",
  question_cout: "bg-orange-100 text-orange-800",
  demande_inscription: "bg-indigo-100 text-indigo-800",
  suivi_demande: "bg-cyan-100 text-cyan-800",
  question_delai: "bg-pink-100 text-pink-800",
};

const LANGUE_FLAGS: Record<string, string> = {
  francais: "🇫🇷",
  wolof: "🇸🇳",
  mixte: "🌍",
};

export default function HistoriquePage() {
  const { compte } = useAuth();
  const [conversations, setConversations] = useState<ConversationEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtreLang, setFiltreLang] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    fetchData();
  }, [compte, filtreLang]);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (compte) params.set("compteId", compte.id);
    if (filtreLang !== "all") params.set("langue", filtreLang);
    params.set("limit", "100");

    const res = await fetch(`/api/historique?${params}`);
    const data = await res.json();
    setConversations(data.conversations);
    setStats(data.stats);
    setLoading(false);
  };

  const filtered = conversations.filter((c) =>
    searchQuery
      ? c.message.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const groupByDate = (entries: ConversationEntry[]) => {
    const groups: Record<string, ConversationEntry[]> = {};
    for (const entry of entries) {
      const date = new Date(entry.createdAt).toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(entry);
    }
    return groups;
  };

  const grouped = groupByDate(filtered);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Retour au chat</span>
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
              <Clock size={20} className="text-blue-600" />
              Historique des conversations
            </h1>
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            className={`p-2 rounded-lg transition ${
              showStats
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            <BarChart3 size={20} />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        {showStats && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {stats.total}
                  </p>
                  <p className="text-sm text-slate-500">Messages total</p>
                </div>
              </div>
            </div>

            {/* Par langue */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Globe size={20} className="text-green-600" />
                </div>
                <p className="text-sm font-medium text-slate-700">Par langue</p>
              </div>
              <div className="space-y-2">
                {stats.par_langue.map((s) => (
                  <div
                    key={s.langue}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-slate-600">
                      {LANGUE_FLAGS[s.langue] || "🌐"} {s.langue}
                    </span>
                    <span className="text-sm font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Par intention */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 size={20} className="text-purple-600" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  Top intentions
                </p>
              </div>
              <div className="space-y-1.5">
                {stats.par_intent.slice(0, 5).map((s) => (
                  <div
                    key={s.intent}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs text-slate-600">
                      {INTENT_LABELS[s.intent] || s.intent}
                    </span>
                    <span className="text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Rechercher dans l'historique..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            {["all", "francais", "wolof"].map((lang) => (
              <button
                key={lang}
                onClick={() => setFiltreLang(lang)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  filtreLang === lang
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {lang === "all"
                  ? "Toutes"
                  : lang === "francais"
                  ? "🇫🇷 Français"
                  : "🇸🇳 Wolof"}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500">Chargement de l&apos;historique...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Aucune conversation trouvée</p>
            <p className="text-slate-400 text-sm mt-1">
              {searchQuery
                ? "Essayez un autre terme de recherche"
                : "Commencez à discuter avec SunuBot pour voir l'historique ici"}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([date, entries]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {date}
                  </span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl mt-0.5">
                          {LANGUE_FLAGS[entry.langue] || "🌐"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 text-sm leading-relaxed">
                            {entry.message}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {entry.intent && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  INTENT_COLORS[entry.intent] ||
                                  "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {INTENT_LABELS[entry.intent] || entry.intent}
                              </span>
                            )}
                            {entry.domaine && entry.domaine !== "general" && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                {entry.domaine.toUpperCase()}
                              </span>
                            )}
                            <span className="text-xs text-slate-400 ml-auto">
                              {new Date(entry.createdAt).toLocaleTimeString(
                                "fr-FR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
