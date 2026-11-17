"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

interface ServiceStatus {
  status: "ok" | "error";
  latency_ms: number;
  detail?: string;
}

interface HealthData {
  status: string;
  timestamp: string;
  services: Record<string, ServiceStatus>;
  uptime_seconds: number;
}

const SERVICE_INFO: Record<string, { label: string; desc: string; icon: string }> = {
  postgres: { label: "PostgreSQL 14", desc: "Base de données principale", icon: "🗄️" },
  nlp: { label: "Backend NLP", desc: "mBERT + Mistral (FastAPI)", icon: "🧠" },
  mistral: { label: "Mistral API", desc: "LLM cloud (mistral-small)", icon: "🤖" },
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}j ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
      setLastCheck(new Date());
    } catch {
      setHealth(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const allOk = health?.status === "healthy";
  const serviceCount = health ? Object.keys(health.services).length : 0;
  const okCount = health ? Object.values(health.services).filter(s => s.status === "ok").length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#e8f0fe]">
      <header className="bg-gradient-to-r from-[#1F5C99] to-[#0f3d6e] text-white px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <a href="/" className="p-2 hover:bg-white/10 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Statut des services</h1>
            <p className="text-white/70 text-sm mt-0.5">Disponibilité en temps réel de SunuBot</p>
          </div>
          <button onClick={fetchHealth} disabled={loading}
            className="p-2 hover:bg-white/10 rounded-lg transition disabled:opacity-50">
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Status banner */}
        <div className={`rounded-2xl p-6 mb-6 text-center ${allOk ? "bg-green-50 border-2 border-green-200" : health ? "bg-amber-50 border-2 border-amber-200" : "bg-gray-50 border-2 border-gray-200"}`}>
          <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${allOk ? "bg-green-100" : health ? "bg-amber-100" : "bg-gray-100"}`}>
            {loading ? (
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
            ) : allOk ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-amber-600" />
            )}
          </div>
          <h2 className={`text-2xl font-black ${allOk ? "text-green-700" : health ? "text-amber-700" : "text-gray-500"}`}>
            {loading ? "Vérification..." : allOk ? "Tous les systèmes sont opérationnels" : health ? "Service dégradé" : "Impossible de vérifier"}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {okCount}/{serviceCount} services actifs
            {health?.uptime_seconds ? ` — Uptime : ${formatUptime(health.uptime_seconds)}` : ""}
          </p>
        </div>

        {/* Services */}
        <div className="space-y-3">
          {health && Object.entries(health.services).map(([key, svc]) => {
            const info = SERVICE_INFO[key] || { label: key, desc: "", icon: "⚙️" };
            return (
              <div key={key} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                <span className="text-2xl">{info.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-800">{info.label}</h3>
                    <span className={`w-2.5 h-2.5 rounded-full ${svc.status === "ok" ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                  </div>
                  <p className="text-[11px] text-gray-500">{info.desc}</p>
                  {svc.detail && <p className="text-[10px] text-gray-400 mt-0.5">{svc.detail}</p>}
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black ${svc.status === "ok" ? "text-green-600" : "text-red-600"}`}>
                    {svc.latency_ms}ms
                  </p>
                  <p className={`text-[10px] font-semibold ${svc.status === "ok" ? "text-green-500" : "text-red-500"}`}>
                    {svc.status === "ok" ? "Opérationnel" : "Hors ligne"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Last check */}
        {lastCheck && (
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            Dernière vérification : {lastCheck.toLocaleTimeString("fr-FR")} — Rafraîchissement auto toutes les 30s
          </div>
        )}

        <div className="text-center py-8 text-xs text-gray-400">
          <p><strong>SunuBot</strong> — Plateforme de services administratifs intelligents</p>
          <p className="mt-1">Mémoire M2 IA — Université de Thiès — Adama GAYE</p>
        </div>
      </main>
    </div>
  );
}
