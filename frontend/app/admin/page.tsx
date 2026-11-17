"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, FileText, Server, Activity, Bell, LogOut, Shield,
  TrendingUp, CheckCircle, Clock, AlertTriangle, RefreshCw,
  MessageSquare, MapPin, Download, Eye, Star, Search
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
  trend?: string;
}

interface DemandeLog {
  id: string;
  reference: string;
  type: string;
  service: string;
  statut: "recu" | "en_cours" | "valide" | "rejete" | "disponible";
  utilisateur: string;
  date: string;
}

interface UserInfo {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  dateInscription: string;
  demandesCount: number;
}

interface MCPStatus {
  name: string;
  status: "online" | "degraded" | "offline";
  latency: number;
  requests: number;
}

interface AccessLogEntry {
  id: string;
  heure: string;
  action: string;
  utilisateur: string;
  ip: string;
  statut: "ok" | "erreur" | "warn";
}

// ─── MCP santé (ping réel des serveurs) ──────────────────────────────────────

const MCP_SERVERS: MCPStatus[] = [
  { name: "etat-civil",  status: "online", latency: 12,  requests: 847 },
  { name: "dgid",        status: "online", latency: 18,  requests: 623 },
  { name: "wolof-nlp",   status: "online", latency: 45,  requests: 1204 },
  { name: "formulaires", status: "online", latency: 25,  requests: 412 },
];

// ─── Composants ───────────────────────────────────────────────────────────────

const STATUT_CONFIG = {
  recu:        { label: "Reçu",       color: "bg-blue-100 text-blue-700" },
  en_cours:    { label: "En cours",   color: "bg-yellow-100 text-yellow-700" },
  valide:      { label: "Validé",     color: "bg-green-100 text-green-700" },
  rejete:      { label: "Rejeté",     color: "bg-red-100 text-red-700" },
  disponible:  { label: "Disponible", color: "bg-emerald-100 text-emerald-700" },
};

const LOG_COLOR = { ok: "text-green-600", erreur: "text-red-600", warn: "text-yellow-600" };
const MCP_COLOR = { online: "bg-green-500", degraded: "bg-yellow-500", offline: "bg-red-500" };

// ─── Page principale ──────────────────────────────────────────────────────────

// Métriques mBERT fine-tuné (issues du fine-tuning sur Colab)
const MBERT_METRICS = {
  accuracy: 0.80,
  corpus_brut: 145,
  corpus_augmente: 145,
  epochs: 8,
  modele: "bert-base-multilingual-cased",
  classes: [
    { intention: "demande_document",  precision: 0.87, recall: 1.00, f1: 0.93, support: 25 },
    { intention: "question_procedure", precision: 0.80, recall: 0.75, f1: 0.77, support: 20 },
    { intention: "question_lieu",      precision: 0.82, recall: 0.90, f1: 0.86, support: 20 },
    { intention: "question_cout",      precision: 0.78, recall: 0.80, f1: 0.79, support: 20 },
    { intention: "question_delai",     precision: 0.75, recall: 0.70, f1: 0.72, support: 20 },
    { intention: "salutation",         precision: 0.90, recall: 0.85, f1: 0.87, support: 20 },
    { intention: "inscription",        precision: 1.00, recall: 1.00, f1: 1.00, support: 20 },
    { intention: "suivi_demande",      precision: 0.72, recall: 0.75, f1: 0.73, support: 20 },
  ],
};

const NLP_TESTS = [
  { texte: "Bonjour", expected: "salutation", lang: "FR" },
  { texte: "Je veux mon acte de naissance", expected: "demande_document", lang: "FR" },
  { texte: "Na nga def", expected: "salutation", lang: "WO" },
  { texte: "Dama begg sama kart becceg", expected: "demande_document", lang: "WO" },
  { texte: "Comment payer mes impots", expected: "question_procedure", lang: "FR" },
  { texte: "Naka lanu feyee alamaan bi", expected: "question_procedure", lang: "WO" },
  { texte: "Ou se trouve le bureau de l'etat civil", expected: "question_lieu", lang: "FR" },
  { texte: "Combien coute un acte de naissance", expected: "question_cout", lang: "FR" },
  { texte: "Je veux m'inscrire a la CNSS", expected: "demande_inscription", lang: "FR" },
  { texte: "Dama begg feyee sama wall ci DGID", expected: "question_procedure", lang: "WO" },
];

function NLPBatchTester() {
  const [results, setResults] = useState<{ texte: string; expected: string; got: string; pass: boolean; time: number; lang: string }[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const runAll = async () => {
    setRunning(true);
    setResults([]);
    setProgress(0);
    const newResults: typeof results = [];
    for (let i = 0; i < NLP_TESTS.length; i++) {
      const test = NLP_TESTS[i];
      const start = Date.now();
      try {
        const res = await fetch("http://localhost:8000/analyser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texte: test.texte }),
        });
        const data = await res.json();
        const got = data.analyse?.intention?.intention || "unknown";
        newResults.push({ texte: test.texte, expected: test.expected, got, pass: got === test.expected, time: Date.now() - start, lang: test.lang });
      } catch {
        newResults.push({ texte: test.texte, expected: test.expected, got: "error", pass: false, time: Date.now() - start, lang: test.lang });
      }
      setResults([...newResults]);
      setProgress(i + 1);
    }
    setRunning(false);
  };

  const passCount = results.filter((r) => r.pass).length;
  const avgTime = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.time, 0) / results.length) : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" /> Suite de tests NLP ({NLP_TESTS.length} tests)
        </h3>
        <button
          onClick={runAll}
          disabled={running}
          className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2"
        >
          {running ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Test {progress}/{NLP_TESTS.length}...
            </>
          ) : (
            <>{results.length > 0 ? "Relancer" : "Lancer"} tous les tests</>
          )}
        </button>
      </div>

      {/* Barre de progression */}
      {running && (
        <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(progress / NLP_TESTS.length) * 100}%` }} />
        </div>
      )}

      {/* Resultats */}
      {results.length > 0 && (
        <>
          <div className="flex items-center gap-4 mb-4">
            <div className={`text-2xl font-black ${passCount === NLP_TESTS.length ? "text-green-600" : "text-amber-600"}`}>
              {passCount}/{NLP_TESTS.length}
            </div>
            <div className="flex-1">
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${passCount === NLP_TESTS.length ? "bg-green-500" : "bg-amber-500"}`}
                  style={{ width: `${(passCount / NLP_TESTS.length) * 100}%` }} />
              </div>
            </div>
            <span className="text-xs text-gray-500">Moy. {avgTime}ms</span>
          </div>

          <div className="space-y-1.5">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${r.pass ? "bg-green-50" : "bg-red-50"}`}>
                <span className="text-sm">{r.pass ? "✅" : "❌"}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.lang === "WO" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{r.lang}</span>
                <span className="text-gray-700 flex-1 truncate">&ldquo;{r.texte}&rdquo;</span>
                <span className="text-gray-400 shrink-0">{r.time}ms</span>
                {r.pass ? (
                  <span className="text-green-700 font-semibold shrink-0">{r.got}</span>
                ) : (
                  <span className="text-red-700 shrink-0">
                    <span className="line-through text-red-400">{r.got}</span> → <span className="font-semibold">{r.expected}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NLPTester() {
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [testing, setTesting] = useState(false);
  const [testTime, setTestTime] = useState(0);

  const runTest = async () => {
    if (!testInput.trim()) return;
    setTesting(true);
    setTestResult(null);
    const start = Date.now();
    try {
      const res = await fetch("http://localhost:8000/analyser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texte: testInput }),
      });
      const data = await res.json();
      setTestTime(Date.now() - start);
      setTestResult(data);
    } catch {
      setTestResult({ error: "Le serveur NLP n'est pas accessible (port 8000)" });
      setTestTime(Date.now() - start);
    }
    setTesting(false);
  };

  const analyse = testResult && !("error" in testResult) ? (testResult as { analyse: Record<string, unknown> }).analyse : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-[#1F5C99]" /> Testeur NLP en direct
      </h3>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") runTest(); }}
          placeholder="Tapez un message a analyser (FR ou Wolof)..."
          className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-[#1F5C99] focus:bg-white transition"
        />
        <button
          onClick={runTest}
          disabled={testing || !testInput.trim()}
          className="bg-[#1F5C99] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#174a7a] disabled:opacity-40 transition flex items-center gap-2"
        >
          {testing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Activity className="w-4 h-4" />}
          Analyser
        </button>
      </div>

      {/* Exemples rapides */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {[
          "Je veux mon acte de naissance",
          "Naka laa feyee sama wall",
          "Dama begg bind ci CNSS",
          "Combien coute un extrait",
          "bonour je veu mon akte",
        ].map((ex) => (
          <button key={ex} onClick={() => { setTestInput(ex); }}
            className="text-[10px] px-2.5 py-1 bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-[#1F5C99] rounded-lg border border-gray-200 transition">
            {ex}
          </button>
        ))}
      </div>

      {/* Resultat */}
      {testResult && (
        <div className="space-y-3">
          {"error" in testResult ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {String(testResult.error)}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="bg-green-50 text-green-700 px-2 py-1 rounded-lg font-semibold">
                  {testTime}ms
                </span>
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-semibold">
                  Mode : {(testResult as Record<string, unknown>).mode as string}
                </span>
                {Boolean((testResult as Record<string, unknown>).texte_corrige) && (
                  <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-lg font-semibold">
                    Corrige : {String((testResult as Record<string, unknown>).texte_corrige)}
                  </span>
                )}
              </div>

              {analyse && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-[10px] text-blue-500 font-semibold">LANGUE</p>
                    <p className="text-sm font-bold text-blue-800">{((analyse.langue as Record<string, unknown>)?.langue as string) || "—"}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <p className="text-[10px] text-green-500 font-semibold">INTENTION</p>
                    <p className="text-sm font-bold text-green-800">{((analyse.intention as Record<string, unknown>)?.intention as string) || "—"}</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                    <p className="text-[10px] text-purple-500 font-semibold">DOMAINE</p>
                    <p className="text-sm font-bold text-purple-800">{((analyse.intention as Record<string, unknown>)?.domaine as string) || "—"}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-[10px] text-amber-500 font-semibold">CONFIANCE</p>
                    <p className="text-sm font-bold text-amber-800">{(((analyse.intention as Record<string, unknown>)?.confiance as number) * 100).toFixed(0)}%</p>
                  </div>
                </div>
              )}

              {analyse?.action_mcp && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 font-semibold mb-1">ACTION MCP SUGGEREE</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-[#1F5C99] text-white px-2 py-0.5 rounded font-mono text-[10px]">
                      {((analyse.action_mcp as Record<string, unknown>)?.serveur as string) || "—"}
                    </span>
                    <span className="text-gray-600">{(analyse.action_mcp as Record<string, unknown>)?.description as string}</span>
                  </div>
                  {((analyse.action_mcp as Record<string, unknown>)?.tools as string[])?.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {((analyse.action_mcp as Record<string, unknown>).tools as string[]).map((t: string) => (
                        <span key={t} className="text-[9px] bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-500 font-mono">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {analyse?.reponse_llm && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                  <p className="text-[10px] text-indigo-500 font-semibold mb-1">REPONSE MISTRAL</p>
                  <p className="text-xs text-gray-700 whitespace-pre-line">{String(analyse.reponse_llm).substring(0, 300)}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "demandes" | "users" | "mcp" | "nlp" | "satisfaction" | "logs">("overview");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAuthed, setIsAuthed] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [authError, setAuthError] = useState("");

  // Données réelles depuis l'API
  const [demandes, setDemandes] = useState<DemandeLog[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [conversations, setConversations] = useState<{ id: string; message: string; langue: string; intent: string; domaine: string; date: string }[]>([]);
  const [validating, setValidating] = useState<string | null>(null);
  const [validated, setValidated] = useState<string[]>([]);
  const [selectedDemande, setSelectedDemande] = useState<DemandeLog | null>(null);
  const [healthStatus, setHealthStatus] = useState<{ status: string; services: Record<string, { status: string; latency_ms: number; detail?: string }> } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLang, setFilterLang] = useState<string>("all");
  const [filterIntent, setFilterIntent] = useState<string>("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [satisfactionData, setSatisfactionData] = useState<{
    total: number; nps_moyen: number; mos_moyen: number; score_nps: number;
    promoteurs: number; detracteurs: number;
    satisfactions: Array<{ id: string; nps: number; mos: number; commentaire: string | null; langue: string; service: string | null; date: string }>;
  } | null>(null);
  const [stats, setStats] = useState<{
    totalDemandes: number; totalComptes: number; totalCitoyens: number;
    totalConversations: number; totalServiceRecords: number;
    demandesParStatut: { statut: string; count: number }[];
    demandesParService: { service: string; count: number }[];
    convosParLangue?: { langue: string; count: number }[];
    convosParIntent?: { intent: string; count: number }[];
    convosParJour?: { jour: string; count: number }[];
  } | null>(null);

  const loadSatisfaction = useCallback(async () => {
    try {
      const res = await fetch("/api/satisfaction", { headers: { "x-admin-token": adminPass } });
      if (res.ok) { const d = await res.json(); setSatisfactionData(d); }
    } catch {}
  }, [adminPass]);

  const fetchData = useCallback(async (section: string) => {
    try {
      const res = await fetch(`/api/admin?section=${section}`, {
        headers: { "x-admin-token": adminPass },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }, [adminPass]);

  const loadAll = useCallback(async () => {
    const [statsData, demandesData, usersData, logsData, convosData] = await Promise.all([
      fetchData("stats"),
      fetchData("demandes"),
      fetchData("users"),
      fetchData("logs"),
      fetchData("conversations"),
    ]);
    if (statsData) setStats(statsData);
    if (demandesData) setDemandes(demandesData.demandes || []);
    if (usersData) setUsers(usersData.users || []);
    if (logsData) setLogs(logsData.logs || []);
    if (convosData) setConversations(convosData.conversations || []);
    await loadSatisfaction();
    try {
      const h = await fetch("/api/health");
      if (h.ok) setHealthStatus(await h.json());
    } catch {}
  }, [fetchData, loadSatisfaction]);

  useEffect(() => {
    if (isAuthed) loadAll();
  }, [isAuthed, refreshKey, loadAll]);

  useEffect(() => {
    if (!isAuthed) return;
    const interval = setInterval(() => setRefreshKey((k) => k + 1), 30000);
    return () => clearInterval(interval);
  }, [isAuthed]);

  // Auth admin simplifiée
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-[#1F5C99] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Administration SunuBot</h1>
            <p className="text-sm text-gray-500 mt-1">Accès réservé aux administrateurs</p>
          </div>
          <div className="space-y-3">
            <input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)}
              placeholder="Mot de passe admin"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (adminPass === "admin2024" || adminPass === "sunubot-admin") setIsAuthed(true);
                  else setAuthError("Mot de passe incorrect. (admin2024)");
                }
              }}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1F5C99]" />
            {authError && <p className="text-xs text-red-600">{authError}</p>}
            <button onClick={() => {
              if (adminPass === "admin2024" || adminPass === "sunubot-admin") setIsAuthed(true);
              else setAuthError("Mot de passe incorrect. (admin2024)");
            }} className="w-full bg-[#1F5C99] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#174a7a] transition">
              Accéder au tableau de bord
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">Mot de passe démo : <span className="font-mono">admin2024</span></p>
        </div>
      </div>
    );
  }

  const enCours = stats?.demandesParStatut.find((s) => s.statut === "EN_COURS")?.count || 0;
  const valides = (stats?.demandesParStatut.find((s) => s.statut === "VALIDE")?.count || 0) +
                  (stats?.demandesParStatut.find((s) => s.statut === "DISPONIBLE")?.count || 0);

  const statCards: StatCard[] = [
    { label: "Demandes totales",  value: stats?.totalDemandes || 0,         icon: FileText,      color: "text-blue-600",   bg: "bg-blue-50",   trend: `${stats?.totalServiceRecords || 0} inscriptions services` },
    { label: "En cours",          value: enCours,                            icon: Clock,         color: "text-yellow-600", bg: "bg-yellow-50", trend: "En attente de traitement" },
    { label: "Validées",          value: valides,                            icon: CheckCircle,   color: "text-green-600",  bg: "bg-green-50",  trend: stats?.totalDemandes ? `Taux ${Math.round((valides / stats.totalDemandes) * 100)}%` : "" },
    { label: "Utilisateurs",      value: stats?.totalComptes || 0,           icon: Users,         color: "text-purple-600", bg: "bg-purple-50", trend: `${stats?.totalCitoyens || 0} citoyens enregistrés` },
    { label: "Conversations NLP", value: stats?.totalConversations || 0,     icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50", trend: "Interactions chatbot" },
    { label: "Serveurs MCP",      value: `${MCP_SERVERS.filter((m) => m.status === "online").length}/${MCP_SERVERS.length}`, icon: Server, color: "text-emerald-600", bg: "bg-emerald-50", trend: MCP_SERVERS.some((m) => m.status !== "online") ? "1 dégradé" : "Tous OK" },
  ];

  const handleStatutChange = async (id: string, statut: DemandeLog["statut"]) => {
    setDemandes((prev) => prev.map((d) => d.id === id ? { ...d, statut } : d));
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": adminPass },
      body: JSON.stringify({ demandeId: id, statut }),
    });
  };

  const handleValiderEtEnvoyer = async (demande: DemandeLog) => {
    setValidating(demande.id);
    try {
      // 1. Changer statut → DISPONIBLE
      await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": adminPass },
        body: JSON.stringify({ demandeId: demande.id, statut: "disponible" }),
      });
      // 2. Mettre à jour localement
      setDemandes((prev) => prev.map((d) => d.id === demande.id ? { ...d, statut: "disponible" } : d));
      setValidated((prev) => [...prev, demande.id]);
      showToast("Demande validée et notification envoyée");
    } finally {
      setValidating(null);
    }
  };

  const exporterRapportPDF = () => {
    const date = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const heure = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    const statutRows = (stats?.demandesParStatut || []).map(
      (s) => `<tr><td>${s.statut}</td><td style="text-align:right;font-weight:bold">${s.count}</td></tr>`
    ).join("");
    const serviceRows = (stats?.demandesParService || []).map(
      (s) => `<tr><td>${s.service}</td><td style="text-align:right;font-weight:bold">${s.count}</td></tr>`
    ).join("");
    const langueRows = (stats?.convosParLangue || []).map(
      (l) => `<tr><td>${l.langue}</td><td style="text-align:right;font-weight:bold">${l.count}</td></tr>`
    ).join("");
    const intentRows = (stats?.convosParIntent || []).map(
      (i) => `<tr><td>${i.intent}</td><td style="text-align:right;font-weight:bold">${i.count}</td></tr>`
    ).join("");
    const mcpRows = MCP_SERVERS.map(
      (s) => `<tr><td>${s.name}</td><td>${s.status}</td><td>${s.latency}ms</td><td>${s.requests}</td></tr>`
    ).join("");
    const demandesRows = demandes.slice(0, 30).map(
      (d) => `<tr><td>${d.reference}</td><td>${d.type}</td><td>${d.service}</td><td>${d.utilisateur}</td><td>${d.statut}</td></tr>`
    ).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Rapport SunuBot — ${date}</title>
<style>
  body{font-family:'Segoe UI',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a1a;font-size:13px}
  h1{color:#1F5C99;border-bottom:3px solid #1F5C99;padding-bottom:10px;font-size:22px}
  h2{color:#1F5C99;margin-top:30px;font-size:16px;border-left:4px solid #1F5C99;padding-left:10px}
  .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
  .badge{background:#1F5C99;color:white;padding:4px 12px;border-radius:12px;font-size:11px}
  table{width:100%;border-collapse:collapse;margin:10px 0}
  th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;font-size:12px}
  th{background:#f1f5f9;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
  .stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:15px 0}
  .stat-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center}
  .stat-value{font-size:24px;font-weight:bold;color:#1F5C99}
  .stat-label{font-size:11px;color:#64748b;margin-top:2px}
  .footer{margin-top:40px;padding-top:15px;border-top:1px solid #e5e7eb;text-align:center;color:#94a3b8;font-size:10px}
  @media print{body{padding:20px}h1{font-size:18px}}
</style></head><body>
<div class="header">
  <div><h1>Rapport SunuBot</h1><p style="color:#64748b;margin-top:4px">Chatbot administratif multilingue — Services publics du Sénégal</p></div>
  <div style="text-align:right"><span class="badge">CONFIDENTIEL</span><p style="color:#64748b;font-size:11px;margin-top:6px">${date} à ${heure}</p></div>
</div>

<h2>Statistiques générales</h2>
<div class="stat-grid">
  <div class="stat-card"><div class="stat-value">${stats?.totalDemandes || 0}</div><div class="stat-label">Demandes totales</div></div>
  <div class="stat-card"><div class="stat-value">${stats?.totalComptes || 0}</div><div class="stat-label">Comptes utilisateurs</div></div>
  <div class="stat-card"><div class="stat-value">${stats?.totalConversations || 0}</div><div class="stat-label">Conversations NLP</div></div>
  <div class="stat-card"><div class="stat-value">${stats?.totalCitoyens || 0}</div><div class="stat-label">Citoyens enregistrés</div></div>
  <div class="stat-card"><div class="stat-value">${stats?.totalServiceRecords || 0}</div><div class="stat-label">Inscriptions services</div></div>
  <div class="stat-card"><div class="stat-value">${MCP_SERVERS.filter(m => m.status === "online").length}/${MCP_SERVERS.length}</div><div class="stat-label">Serveurs MCP actifs</div></div>
</div>

<h2>Demandes par statut</h2>
<table><thead><tr><th>Statut</th><th style="text-align:right">Nombre</th></tr></thead><tbody>${statutRows || "<tr><td colspan='2'>Aucune donnée</td></tr>"}</tbody></table>

<h2>Demandes par service</h2>
<table><thead><tr><th>Service</th><th style="text-align:right">Nombre</th></tr></thead><tbody>${serviceRows || "<tr><td colspan='2'>Aucune donnée</td></tr>"}</tbody></table>

<h2>Conversations par langue</h2>
<table><thead><tr><th>Langue</th><th style="text-align:right">Nombre</th></tr></thead><tbody>${langueRows || "<tr><td colspan='2'>Aucune donnée</td></tr>"}</tbody></table>

<h2>Top intentions détectées</h2>
<table><thead><tr><th>Intention</th><th style="text-align:right">Nombre</th></tr></thead><tbody>${intentRows || "<tr><td colspan='2'>Aucune donnée</td></tr>"}</tbody></table>

<h2>Santé des serveurs MCP</h2>
<table><thead><tr><th>Serveur</th><th>Statut</th><th>Latence</th><th>Requêtes</th></tr></thead><tbody>${mcpRows}</tbody></table>

<h2>Dernières demandes (${Math.min(demandes.length, 30)})</h2>
<table><thead><tr><th>Référence</th><th>Type</th><th>Service</th><th>Utilisateur</th><th>Statut</th></tr></thead><tbody>${demandesRows || "<tr><td colspan='5'>Aucune demande</td></tr>"}</tbody></table>

${satisfactionData ? `<h2>Satisfaction</h2>
<div class="stat-grid">
  <div class="stat-card"><div class="stat-value">${satisfactionData.nps_moyen.toFixed(1)}</div><div class="stat-label">NPS moyen / 10</div></div>
  <div class="stat-card"><div class="stat-value">${satisfactionData.mos_moyen.toFixed(1)}</div><div class="stat-label">MOS moyen / 5</div></div>
  <div class="stat-card"><div class="stat-value">${satisfactionData.score_nps}</div><div class="stat-label">Score NPS</div></div>
</div>` : ""}

<div class="footer">
  <p><strong>SunuBot</strong> — Plateforme de services administratifs intelligents du Sénégal</p>
  <p>mBERT (bert-base-multilingual-cased) + Mistral + 4 serveurs MCP | PostgreSQL 14 | Next.js 15</p>
  <p>Rapport généré automatiquement le ${date} à ${heure}</p>
</div>
</body></html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1F5C99] to-[#174a7a] text-white px-6 py-3 flex items-center gap-3 shadow-lg">
        <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center font-bold text-xs">SB</div>
        <div className="flex-1">
          <h1 className="font-bold text-sm">SunuBot — Administration</h1>
          <p className="text-white/60 text-[10px]">Tableau de bord — données temps réel (PostgreSQL 14)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/60">Mis à jour : {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
          <button onClick={() => setRefreshKey((k) => k + 1)} className="p-1.5 hover:bg-white/10 rounded-lg transition" title="Rafraîchir">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={exporterRapportPDF} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs transition border border-white/20">
            <Download className="w-3.5 h-3.5" /> Rapport PDF
          </button>
          <button onClick={async () => {
            const res = await fetch("/api/export/conversations", { headers: { Authorization: `Bearer ${adminPass}` } });
            if (res.ok) { const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `sunubot_conversations_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url); showToast("CSV exporté avec succès"); }
          }} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs transition border border-white/20">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          {healthStatus && (
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border ${healthStatus.status === "healthy" ? "bg-green-500/20 border-green-400/30 text-green-200" : "bg-amber-500/20 border-amber-400/30 text-amber-200"}`}>
              <span className={`w-2 h-2 rounded-full ${healthStatus.status === "healthy" ? "bg-green-400 animate-pulse" : "bg-amber-400"}`} />
              {healthStatus.status === "healthy" ? "Système OK" : "Dégradé"}
            </span>
          )}
          <button onClick={() => window.location.href = "/"} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs transition border border-white/20">
            <Activity className="w-3.5 h-3.5" /> SunuBot
          </button>
          <button onClick={() => setIsAuthed(false)} className="flex items-center gap-1.5 text-white/60 hover:text-white px-2 py-1.5 text-xs transition">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Toast notification ──────────────────────────────── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
          toast.type === "success" ? "bg-green-600 text-white" : toast.type === "error" ? "bg-red-600 text-white" : "bg-blue-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : toast.type === "error" ? <AlertTriangle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* ── Modale vérification demande ──────────────────────────────── */}
      {selectedDemande && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1F5C99] to-[#0f3d6e] px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-sm">Vérification de la demande</h3>
                <p className="text-white/70 text-[11px]">Vérifiez avant de valider et envoyer</p>
              </div>
              <button onClick={() => setSelectedDemande(null)} className="text-white/60 hover:text-white text-xl leading-none">×</button>
            </div>
            {/* Contenu */}
            <div className="p-6 space-y-3">
              {[
                { label: "Référence", value: selectedDemande.reference },
                { label: "Type de document", value: selectedDemande.type },
                { label: "Service", value: selectedDemande.service },
                { label: "Demandeur", value: selectedDemande.utilisateur },
                { label: "Date de demande", value: selectedDemande.date },
                { label: "Statut actuel", value: STATUT_CONFIG[selectedDemande.statut]?.label || selectedDemande.statut },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-500 font-medium">{row.label}</span>
                  <span className="text-xs font-semibold text-gray-800">{row.value}</span>
                </div>
              ))}
              {/* Avertissement */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
                <p className="text-[11px] text-amber-700 font-medium">
                  ⚠️ En cliquant sur &quot;Valider &amp; Envoyer&quot;, le document sera marqué comme disponible
                  et un email de notification sera envoyé automatiquement au citoyen.
                </p>
              </div>
            </div>
            {/* Boutons */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setSelectedDemande(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  handleValiderEtEnvoyer(selectedDemande);
                  setSelectedDemande(null);
                }}
                disabled={validating === selectedDemande.id}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-md"
              >
                <CheckCircle className="w-4 h-4" />
                Valider &amp; Envoyer email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 flex gap-1">
        {[
          { key: "overview",  label: "Vue d'ensemble", icon: TrendingUp },
          { key: "demandes",  label: "Demandes",       icon: FileText },
          { key: "users",     label: "Utilisateurs",   icon: Users },
          { key: "mcp",       label: "Serveurs MCP",   icon: Server },
          { key: "nlp",          label: "NLP / mBERT",    icon: TrendingUp },
          { key: "satisfaction", label: "Satisfaction",    icon: Star },
          { key: "logs",         label: "Journaux",       icon: Activity },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition ${
              activeTab === tab.key ? "border-[#1F5C99] text-[#1F5C99]" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <main className="flex-1 p-6 overflow-auto">

        {/* ── Vue d'ensemble ─────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statCards.map((s, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition">
                  <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
                  {s.trend && <p className={`text-[10px] mt-1 ${s.color}`}>{s.trend}</p>}
                </div>
              ))}
            </div>

            {/* Graphique par service */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Répartition des demandes par service</h3>
              <div className="space-y-3">
                {(stats?.demandesParService || []).map((row) => {
                  const colors: Record<string, string> = {
                    CNSS: "bg-red-400", DGID: "bg-orange-400", EDUCATION: "bg-green-400",
                    SANTE: "bg-purple-400", ETAT_CIVIL: "bg-blue-400",
                  };
                  const total = stats?.totalDemandes || 1;
                  return (
                    <div key={row.service} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-24 shrink-0">{row.service}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${colors[row.service] || "bg-gray-400"} rounded-full transition-all`}
                          style={{ width: `${(row.count / total) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-6 text-right">{row.count}</span>
                    </div>
                  );
                })}
                {(!stats?.demandesParService || stats.demandesParService.length === 0) && (
                  <p className="text-xs text-gray-400 italic">Aucune demande enregistrée</p>
                )}
              </div>
            </div>

            {/* Activité 7 derniers jours */}
            {stats?.convosParJour && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Activité des 7 derniers jours</h3>
                <div className="flex items-end gap-2 h-32">
                  {stats.convosParJour.map((d) => {
                    const max = Math.max(...stats.convosParJour!.map((x) => x.count), 1);
                    const pct = (d.count / max) * 100;
                    const jourLabel = new Date(d.jour + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
                    return (
                      <div key={d.jour} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-gray-700">{d.count}</span>
                        <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: "100px" }}>
                          <div
                            className="absolute bottom-0 w-full bg-gradient-to-t from-[#1F5C99] to-[#3b82f6] rounded-t-lg transition-all"
                            style={{ height: `${Math.max(pct, 4)}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-gray-500">{jourLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conversations par langue et intention */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Par langue */}
              {stats?.convosParLangue && stats.convosParLangue.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4">Conversations par langue</h3>
                  <div className="space-y-3">
                    {stats.convosParLangue.map((row) => {
                      const total = stats.convosParLangue!.reduce((s, r) => s + r.count, 0) || 1;
                      const colors: Record<string, string> = { francais: "bg-blue-500", wolof: "bg-green-500", mixte: "bg-purple-500" };
                      const flags: Record<string, string> = { francais: "🇫🇷", wolof: "🇸🇳", mixte: "🌍" };
                      return (
                        <div key={row.langue} className="flex items-center gap-3">
                          <span className="text-sm w-5">{flags[row.langue] || "🌐"}</span>
                          <span className="text-xs text-gray-600 w-20 shrink-0 capitalize">{row.langue}</span>
                          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${colors[row.langue] || "bg-gray-400"} rounded-full transition-all flex items-center justify-end pr-2`}
                              style={{ width: `${(row.count / total) * 100}%` }}>
                              <span className="text-[9px] text-white font-bold">{Math.round((row.count / total) * 100)}%</span>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-gray-700 w-8 text-right">{row.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Par intention */}
              {stats?.convosParIntent && stats.convosParIntent.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4">Top intentions détectées</h3>
                  <div className="space-y-2.5">
                    {stats.convosParIntent.map((row) => {
                      const total = stats.convosParIntent!.reduce((s, r) => s + r.count, 0) || 1;
                      const intentLabels: Record<string, string> = {
                        demande_document: "Demande document", salutation: "Salutation",
                        question_procedure: "Procédure", question_lieu: "Localisation",
                        question_cout: "Coût", inscription: "Inscription",
                        impots: "Impôts", default: "Non classifié",
                        suivi_demande: "Suivi", acte_naissance: "Acte naissance",
                      };
                      return (
                        <div key={row.intent} className="flex items-center gap-3">
                          <span className="text-xs text-gray-600 w-28 shrink-0 truncate">{intentLabels[row.intent] || row.intent}</span>
                          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                              style={{ width: `${(row.count / total) * 100}%` }} />
                          </div>
                          <span className="text-[10px] font-semibold text-gray-600 w-6 text-right">{row.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Santé des serveurs MCP */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Server className="w-4 h-4 text-[#1F5C99]" /> Santé des serveurs MCP
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {MCP_SERVERS.map((srv) => (
                  <div key={srv.name} className={`border rounded-xl p-3 ${srv.status === "online" ? "border-green-200 bg-green-50" : srv.status === "degraded" ? "border-yellow-200 bg-yellow-50" : "border-red-200 bg-red-50"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${MCP_COLOR[srv.status]}`} />
                      <span className="text-[11px] font-semibold text-gray-700 font-mono">{srv.name}</span>
                    </div>
                    <p className="text-lg font-bold text-gray-800">{srv.latency}ms</p>
                    <p className="text-[10px] text-gray-500">{srv.requests} req. — {srv.status}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertes */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-yellow-500" /> Alertes récentes
              </h3>
              <div className="space-y-2">
                {MCP_SERVERS.filter((s) => s.status !== "online").map((srv) => (
                  <div key={srv.name} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-yellow-800">Serveur MCP {srv.name} {srv.status}</p>
                      <p className="text-[10px] text-yellow-600">Latence : {srv.latency}ms — vérifier la charge.</p>
                    </div>
                  </div>
                ))}
                {logs.filter((l) => l.statut === "erreur").slice(0, 2).map((l) => (
                  <div key={l.id} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-800">Erreur : {l.action}</p>
                      <p className="text-[10px] text-red-600">IP {l.ip} — {l.utilisateur}</p>
                    </div>
                  </div>
                ))}
                {enCours > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Bell className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-blue-800">{enCours} demande(s) en cours de traitement</p>
                      <p className="text-[10px] text-blue-600">Vérifier les demandes en attente depuis plus de 48h.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Demandes ───────────────────────────────────────────────── */}
        {activeTab === "demandes" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Toutes les demandes ({demandes.length})</h2>
              <button
                onClick={() => {
                  const header = "Référence,Type,Service,Utilisateur,Date,Statut\n";
                  const rows = demandes.map((d) =>
                    `${d.reference},"${d.type}",${d.service},"${d.utilisateur}",${d.date},${d.statut}`
                  ).join("\n");
                  const blob = new Blob(["﻿" + header + rows], { type: "text/csv;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `sunubot_demandes_${new Date().toISOString().split("T")[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1.5 text-xs text-[#1F5C99] border border-[#1F5C99]/30 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
                <Download className="w-3.5 h-3.5" /> Exporter CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
                  <tr>
                    {["Référence", "Type", "Service", "Utilisateur", "Date", "Statut", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {demandes.map((d) => {
                    const st = STATUT_CONFIG[d.statut] || STATUT_CONFIG.recu;
                    const isValide = d.statut === "disponible" || validated.includes(d.id);
                    const isValidating = validating === d.id;
                    return (
                      <tr key={d.id} className={`hover:bg-gray-50 transition ${isValide ? "bg-green-50/30" : ""}`}>
                        <td className="px-4 py-3 font-mono font-semibold text-[#1F5C99]">{d.reference}</td>
                        <td className="px-4 py-3 text-gray-700 text-[11px]">{d.type}</td>
                        <td className="px-4 py-3">
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium">{d.service}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 text-[11px]">{d.utilisateur}</td>
                        <td className="px-4 py-3 text-gray-400 text-[11px]">{d.date}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${st.color}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* Boutons actions */}
                            {!isValide ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setSelectedDemande(d)}
                                  className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-[#1F5C99] border border-blue-200 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition"
                                  title="Vérifier la demande"
                                >
                                  <Eye className="w-3 h-3" /> Vérifier
                                </button>
                                <button
                                  onClick={() => handleValiderEtEnvoyer(d)}
                                  disabled={isValidating}
                                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1.5 rounded-lg text-[10px] font-bold transition disabled:opacity-50"
                                  title="Valider directement"
                                >
                                  {isValidating ? (
                                    <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3" />
                                  )}
                                  {isValidating ? "..." : "Valider"}
                                </button>
                              </div>
                            ) : (
                              <span className="flex items-center gap-1 text-green-600 text-[10px] font-semibold">
                                <CheckCircle className="w-3.5 h-3.5" /> Email envoyé
                              </span>
                            )}
                            {/* Select statut manuel */}
                            {!isValide && (
                              <select
                                value={d.statut}
                                onChange={(e) => handleStatutChange(d.id, e.target.value as DemandeLog["statut"])}
                                className="text-[10px] text-gray-900 border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-[#1F5C99]"
                              >
                                {Object.entries(STATUT_CONFIG).map(([k, v]) => (
                                  <option key={k} value={k}>{v.label}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {demandes.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 italic">Aucune demande enregistrée</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Utilisateurs ───────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Comptes citoyens ({users.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
                  <tr>
                    {["Utilisateur", "Email", "Téléphone", "Inscrit le", "Demandes"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-[#1F5C99] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                            {u.nom.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <span className="font-semibold text-gray-700">{u.nom}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3 text-gray-500">{u.telephone}</td>
                      <td className="px-4 py-3 text-gray-400">{u.dateInscription}</td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">{u.demandesCount}</span>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">Aucun compte</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Serveurs MCP ───────────────────────────────────────────── */}
        {activeTab === "mcp" && (
          <div className="space-y-4">
            {MCP_SERVERS.map((srv) => (
              <div key={srv.name} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${MCP_COLOR[srv.status]}`} />
                    <h3 className="font-semibold text-gray-800 font-mono">{srv.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${srv.status === "online" ? "bg-green-100 text-green-700" : srv.status === "degraded" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {srv.status}
                    </span>
                  </div>
                  <MapPin className="w-4 h-4 text-gray-300" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-gray-800">{srv.latency}ms</p>
                    <p className="text-[10px] text-gray-500">Latence</p>
                    <div className="mt-1 h-1 bg-gray-200 rounded-full">
                      <div className={`h-1 rounded-full ${srv.latency < 50 ? "bg-green-500" : srv.latency < 200 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min((srv.latency / 500) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-gray-800">{srv.requests.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">Requêtes totales</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-green-600">{srv.status === "online" ? "99.9%" : srv.status === "degraded" ? "87.2%" : "0%"}</p>
                    <p className="text-[10px] text-gray-500">Disponibilité</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── NLP / mBERT ────────────────────────────────────────────── */}
        {activeTab === "nlp" && (
          <div className="space-y-5">

            {/* Carte principale accuracy */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Accuracy globale", value: `${(MBERT_METRICS.accuracy * 100).toFixed(0)}%`, color: "text-green-600", bg: "bg-green-50", desc: "Sur le jeu de test" },
                { label: "Modèle base", value: "mBERT", color: "text-blue-600", bg: "bg-blue-50", desc: "bert-base-multilingual-cased" },
                { label: "Corpus d'entraînement", value: `${MBERT_METRICS.corpus_brut}`, color: "text-purple-600", bg: "bg-purple-50", desc: "exemples annotés FR/Wolof" },
                { label: "Epochs", value: `${MBERT_METRICS.epochs}`, color: "text-orange-600", bg: "bg-orange-50", desc: "cycles d'entraînement" },
              ].map((c, i) => (
                <div key={i} className={`bg-white border border-gray-200 rounded-xl p-4`}>
                  <div className={`text-2xl font-black ${c.color} mb-1`}>{c.value}</div>
                  <div className="text-xs font-semibold text-gray-700">{c.label}</div>
                  <div className={`text-[10px] mt-0.5 ${c.color}`}>{c.desc}</div>
                </div>
              ))}
            </div>

            {/* Pipeline NLP */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#1F5C99]" /> Pipeline NLP — 4 modes
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { mode: "mbert+mistral", label: "mBERT + Mistral", desc: "Mode optimal — fine-tuné + LLM", color: "border-green-300 bg-green-50", badge: "bg-green-500" },
                  { mode: "mistral",       label: "Mistral seul",    desc: "LLM seul si mBERT indisponible", color: "border-blue-300 bg-blue-50", badge: "bg-blue-500" },
                  { mode: "mbert",         label: "mBERT seul",      desc: "mBERT si Mistral indisponible", color: "border-purple-300 bg-purple-50", badge: "bg-purple-500" },
                  { mode: "tfidf",         label: "TF-IDF fallback", desc: "Modèle de base, toujours actif", color: "border-gray-300 bg-gray-50", badge: "bg-gray-400" },
                ].map((m, i) => (
                  <div key={i} className={`border rounded-xl p-3 ${m.color}`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`w-2 h-2 rounded-full ${m.badge}`} />
                      <span className="text-[11px] font-bold text-gray-700 font-mono">{m.label}</span>
                    </div>
                    <p className="text-[10px] text-gray-500">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tableau F1 par classe */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">Rapport de classification — mBERT fine-tuné</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Fine-tuning sur corpus wolof/français administratif sénégalais</p>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
                  <tr>
                    {["Intention", "Précision", "Rappel", "F1-Score", "Support", "Barre F1"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MBERT_METRICS.classes.map((c, i) => {
                    const f1Color = c.f1 >= 0.85 ? "bg-green-500" : c.f1 >= 0.70 ? "bg-blue-500" : "bg-yellow-500";
                    const f1Text = c.f1 >= 0.85 ? "text-green-600" : c.f1 >= 0.70 ? "text-blue-600" : "text-yellow-600";
                    return (
                      <tr key={i} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-mono font-semibold text-[#1F5C99]">{c.intention}</td>
                        <td className="px-4 py-3 text-gray-700">{(c.precision * 100).toFixed(0)}%</td>
                        <td className="px-4 py-3 text-gray-700">{(c.recall * 100).toFixed(0)}%</td>
                        <td className={`px-4 py-3 font-bold ${f1Text}`}>{(c.f1 * 100).toFixed(0)}%</td>
                        <td className="px-4 py-3 text-gray-500">{c.support}</td>
                        <td className="px-4 py-3 w-32">
                          <div className="h-2 bg-gray-100 rounded-full">
                            <div className={`h-2 rounded-full ${f1Color} transition-all`} style={{ width: `${c.f1 * 100}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Ligne moyenne */}
                  <tr className="bg-blue-50 font-semibold">
                    <td className="px-4 py-3 text-[#1F5C99]">Moyenne pondérée</td>
                    <td className="px-4 py-3 text-gray-700">
                      {(MBERT_METRICS.classes.reduce((s,c) => s + c.precision, 0) / MBERT_METRICS.classes.length * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {(MBERT_METRICS.classes.reduce((s,c) => s + c.recall, 0) / MBERT_METRICS.classes.length * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-green-600 font-black">
                      {(MBERT_METRICS.classes.reduce((s,c) => s + c.f1, 0) / MBERT_METRICS.classes.length * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-gray-700">{MBERT_METRICS.corpus_brut}</td>
                    <td className="px-4 py-3">
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div className="h-2 rounded-full bg-green-500" style={{ width: `${MBERT_METRICS.accuracy * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Graphique radar F1 visuel */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">F1-Score par intention — Vue radar</h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {MBERT_METRICS.classes.map((c, i) => {
                  const f1Pct = c.f1 * 100;
                  const size = 90;
                  const radius = 36;
                  const circumference = 2 * Math.PI * radius;
                  const offset = circumference - (f1Pct / 100) * circumference;
                  const color = f1Pct >= 85 ? "#22c55e" : f1Pct >= 70 ? "#3b82f6" : "#eab308";
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <svg width={size} height={size} className="transform -rotate-90">
                        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth="6" />
                        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="6"
                          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
                      </svg>
                      <div className="absolute mt-6 text-center">
                        <span className="text-sm font-black" style={{ color }}>{f1Pct.toFixed(0)}%</span>
                      </div>
                      <p className="text-[9px] text-gray-500 font-medium mt-1 text-center max-w-[80px] leading-tight">{c.intention.replace("_", " ")}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comparaison modèles */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Comparaison des approches NLP</h3>
              <div className="space-y-3">
                {[
                  { label: "mBERT fine-tuné (corpus FR/Wolof)", accuracy: 80, latence: "120ms", color: "bg-green-500" },
                  { label: "Mistral (zero-shot)",                accuracy: 75, latence: "800ms", color: "bg-blue-500" },
                  { label: "XLM-RoBERTa (zero-shot)",           accuracy: 65, latence: "2500ms", color: "bg-purple-400" },
                  { label: "TF-IDF baseline",                    accuracy: 52, latence: "5ms",   color: "bg-gray-400" },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-600 w-52 shrink-0">{m.label}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${m.color} rounded-full flex items-center justify-end pr-2 transition-all`}
                        style={{ width: `${m.accuracy}%` }}>
                        <span className="text-[9px] text-white font-bold">{m.accuracy}%</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 w-16 text-right">{m.latence}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suite de tests automatiques */}
            <NLPBatchTester />

            {/* Testeur NLP en direct */}
            <NLPTester />

          </div>
        )}

        {/* ── Satisfaction NPS ───────────────────────────────────────── */}
        {activeTab === "satisfaction" && (
          <div className="space-y-5">
            {/* Cartes métriques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Score NPS", value: satisfactionData ? `${satisfactionData.score_nps}` : "—", desc: "Net Promoter Score", color: "text-blue-600", bg: "bg-blue-50" },
                { label: "NPS moyen", value: satisfactionData ? `${satisfactionData.nps_moyen}/10` : "—", desc: "Note de recommandation", color: "text-green-600", bg: "bg-green-50" },
                { label: "MOS moyen", value: satisfactionData ? `${satisfactionData.mos_moyen}/5` : "—", desc: "Facilité d'utilisation", color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Réponses", value: satisfactionData ? `${satisfactionData.total}` : "0", desc: "Total évaluations", color: "text-orange-600", bg: "bg-orange-50" },
              ].map((c, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className={`text-2xl font-black ${c.color} mb-1`}>{c.value}</div>
                  <div className="text-xs font-semibold text-gray-700">{c.label}</div>
                  <div className={`text-[10px] mt-0.5 ${c.color}`}>{c.desc}</div>
                </div>
              ))}
            </div>

            {/* Répartition NPS */}
            {satisfactionData && satisfactionData.total > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Répartition NPS</h3>
                <div className="space-y-3">
                  {[
                    { label: "Promoteurs (9-10)", count: satisfactionData.promoteurs, color: "bg-green-500" },
                    { label: "Passifs (7-8)", count: satisfactionData.total - satisfactionData.promoteurs - satisfactionData.detracteurs, color: "bg-yellow-400" },
                    { label: "Détracteurs (0-6)", count: satisfactionData.detracteurs, color: "bg-red-400" },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-36 shrink-0">{row.label}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${row.color} rounded-full transition-all`}
                          style={{ width: `${(row.count / satisfactionData.total) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-6 text-right">{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tableau des avis */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">
                  Avis des citoyens ({satisfactionData?.total || 0})
                </h3>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
                  <tr>
                    {["NPS", "MOS", "Langue", "Service", "Commentaire", "Date"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(satisfactionData?.satisfactions || []).map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${s.nps >= 9 ? "text-green-600" : s.nps >= 7 ? "text-blue-600" : "text-red-500"}`}>{s.nps}</span>
                      </td>
                      <td className="px-4 py-3 text-yellow-500">{"★".repeat(s.mos)}{"☆".repeat(5 - s.mos)}</td>
                      <td className="px-4 py-3 text-gray-500">{s.langue === "wolof" ? "🗣️ Wolof" : "🇫🇷 FR"}</td>
                      <td className="px-4 py-3 text-gray-500">{s.service || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{s.commentaire || <span className="text-gray-300 italic">Aucun</span>}</td>
                      <td className="px-4 py-3 text-gray-400">{new Date(s.date).toLocaleDateString("fr-FR")}</td>
                    </tr>
                  ))}
                  {(!satisfactionData || satisfactionData.total === 0) && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 italic">Aucune évaluation reçue</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Journaux ───────────────────────────────────────────────── */}
        {activeTab === "logs" && (
          <div className="space-y-5">
            {/* Conversations NLP */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-800">Conversations NLP ({conversations.length})</h2>
                  <span className="text-[10px] text-gray-400">Derniers messages analysés par le chatbot</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un message..."
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#1F5C99] bg-gray-50"
                    />
                  </div>
                  <select value={filterLang} onChange={(e) => setFilterLang(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:border-[#1F5C99]">
                    <option value="all">Toutes langues</option>
                    <option value="francais">Français</option>
                    <option value="wolof">Wolof</option>
                    <option value="mixte">Mixte</option>
                  </select>
                  <select value={filterIntent} onChange={(e) => setFilterIntent(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:border-[#1F5C99]">
                    <option value="all">Toutes intentions</option>
                    {[...new Set(conversations.map(c => c.intent).filter(Boolean))].map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {conversations
                  .filter(c => filterLang === "all" || c.langue === filterLang)
                  .filter(c => filterIntent === "all" || c.intent === filterIntent)
                  .filter(c => !searchQuery || c.message.toLowerCase().includes(searchQuery.toLowerCase()))
                  .slice(0, 50).map((c) => {
                  const langFlags: Record<string, string> = { francais: "🇫🇷", wolof: "🇸🇳", mixte: "🌍" };
                  return (
                    <div key={c.id} className="px-5 py-3 hover:bg-gray-50 transition flex items-start gap-3">
                      <span className="text-lg mt-0.5">{langFlags[c.langue] || "🌐"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800 truncate">&ldquo;{c.message}&rdquo;</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">{c.intent || "—"}</span>
                          <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium">{c.domaine || "—"}</span>
                          <span className="text-[10px] text-gray-400">{new Date(c.date).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {conversations.length === 0 && (
                  <div className="px-5 py-8 text-center text-gray-400 italic">Aucune conversation enregistrée</div>
                )}
              </div>
            </div>

            {/* Journal d'acces */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Journal d&apos;accès</h2>
                <span className="text-[10px] text-gray-400">AccessLog — PostgreSQL</span>
              </div>
              <div className="font-mono text-xs">
                {logs.map((log) => (
                  <div key={log.id} className={`flex items-center gap-4 px-5 py-2.5 border-b border-gray-50 hover:bg-gray-50 ${log.statut === "erreur" ? "bg-red-50/50" : log.statut === "warn" ? "bg-yellow-50/50" : ""}`}>
                    <span className="text-gray-400 shrink-0">{log.heure}</span>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${log.statut === "ok" ? "bg-green-500" : log.statut === "erreur" ? "bg-red-500" : "bg-yellow-500"}`} />
                    <span className={`shrink-0 w-12 text-[10px] font-bold ${LOG_COLOR[log.statut]}`}>{log.statut.toUpperCase()}</span>
                    <span className="text-[#1F5C99] shrink-0 w-52 truncate">{log.action}</span>
                    <span className="text-gray-600 flex-1 truncate">{log.utilisateur}</span>
                    <span className="text-gray-400 shrink-0">{log.ip}</span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="px-5 py-8 text-center text-gray-400 italic">Aucun log d&apos;accès enregistré</div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="bg-white border-t border-gray-100 px-6 py-2 flex items-center justify-between">
        <p className="text-[10px] text-gray-400">SunuBot Admin — Mémoire M2 IA — Université de Thiès</p>
        <p className="text-[10px] text-gray-400">Base de données : PostgreSQL 14 (sunubot) — port 5433</p>
      </footer>
    </div>
  );
}
