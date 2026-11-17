"use client";

import { useState } from "react";
import { ArrowLeft, Server, Lock, Globe, Zap } from "lucide-react";

const ENDPOINTS = [
  {
    method: "POST", path: "/api/chat", auth: false, category: "Chat",
    desc: "Envoyer un message au chatbot. Analyse NLP + routage MCP + réponse Mistral.",
    body: '{ "message": "Je veux mon acte de naissance", "langue": "auto" }',
    response: '{ "response": "...", "langue": "francais", "tools_used": ["etat_civil"], "analyse": {...} }',
  },
  {
    method: "GET", path: "/api/health", auth: false, category: "Monitoring",
    desc: "Vérifier la santé du système (PostgreSQL, NLP, Mistral).",
    body: null,
    response: '{ "status": "healthy", "services": { "postgres": { "status": "ok", "latency_ms": 12 }, ... } }',
  },
  {
    method: "GET", path: "/api/stats", auth: false, category: "Statistiques",
    desc: "Statistiques publiques : activité, langues, intentions.",
    body: null,
    response: '{ "total": 150, "parLangue": [...], "parIntent": [...], "parJour": [...] }',
  },
  {
    method: "POST", path: "/api/auth/login", auth: false, category: "Auth",
    desc: "Connexion citoyen. Retourne un token JWT.",
    body: '{ "email": "user@example.com", "motDePasse": "..." }',
    response: '{ "token": "eyJ...", "compte": { "id": "...", "prenom": "Adama", ... } }',
  },
  {
    method: "POST", path: "/api/auth/register", auth: false, category: "Auth",
    desc: "Inscription citoyen avec email et téléphone.",
    body: '{ "prenom": "Adama", "nom": "Gaye", "email": "...", "telephone": "+221...", "motDePasse": "..." }',
    response: '{ "token": "eyJ...", "compte": {...} }',
  },
  {
    method: "GET", path: "/api/admin?section=stats", auth: true, category: "Admin",
    desc: "Statistiques complètes du dashboard admin.",
    body: null,
    response: '{ "totalDemandes": 42, "totalComptes": 15, "totalConversations": 350, ... }',
  },
  {
    method: "GET", path: "/api/export/conversations", auth: true, category: "Admin",
    desc: "Export CSV de toutes les conversations NLP.",
    body: null,
    response: "Fichier CSV (text/csv)",
  },
  {
    method: "POST", path: "/api/satisfaction", auth: false, category: "Feedback",
    desc: "Soumettre un avis NPS/MOS ou une réaction sur un message.",
    body: '{ "nps": 9, "mos": 4, "commentaire": "Très utile !", "langue": "francais" }',
    response: '{ "success": true }',
  },
  {
    method: "POST", path: "http://localhost:8000/analyser", auth: false, category: "NLP",
    desc: "Analyse NLP directe : détection langue, intention, domaine, correction typo.",
    body: '{ "texte": "Dama begg sama kart becceg" }',
    response: '{ "analyse": { "langue": {...}, "intention": {...} }, "mode": "mbert+mistral" }',
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-green-700 border-green-200",
  POST: "bg-blue-100 text-blue-700 border-blue-200",
  PATCH: "bg-yellow-100 text-yellow-700 border-yellow-200",
  DELETE: "bg-red-100 text-red-700 border-red-200",
};

const CATEGORIES = [...new Set(ENDPOINTS.map(e => e.category))];

export default function ApiDocsPage() {
  const [activeCategory, setActiveCategory] = useState("Chat");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#e8f0fe]">
      <header className="bg-gradient-to-r from-[#1F5C99] to-[#0f3d6e] text-white px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <a href="/" className="p-2 hover:bg-white/10 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Server className="w-5 h-5" /> API Documentation
            </h1>
            <p className="text-white/70 text-sm mt-0.5">SunuBot REST API — Next.js + FastAPI</p>
          </div>
          <span className="text-[10px] bg-white/15 border border-white/20 px-2.5 py-1 rounded-full">v1.0</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Info boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Base URL</p>
              <p className="text-[10px] text-gray-500 font-mono">http://localhost:5001</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">NLP Backend</p>
              <p className="text-[10px] text-gray-500 font-mono">http://localhost:8000</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Auth Admin</p>
              <p className="text-[10px] text-gray-500">Header: <code className="bg-gray-100 px-1 rounded">x-admin-token</code></p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeCategory === cat
                  ? "bg-[#1F5C99] text-white shadow-lg"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[#1F5C99]/30"
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Endpoints */}
        <div className="space-y-4">
          {ENDPOINTS.filter(e => e.category === activeCategory).map((ep, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${METHOD_COLORS[ep.method]}`}>
                  {ep.method}
                </span>
                <code className="text-sm font-mono text-gray-800 font-semibold">{ep.path}</code>
                {ep.auth && (
                  <span className="text-[9px] bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Admin
                  </span>
                )}
              </div>
              <div className="px-5 pb-4">
                <p className="text-xs text-gray-600 mb-3">{ep.desc}</p>
                {ep.body && (
                  <div className="mb-2">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Request Body</p>
                    <pre className="bg-gray-900 text-green-300 text-[11px] rounded-lg p-3 overflow-x-auto font-mono">{ep.body}</pre>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Response</p>
                  <pre className="bg-gray-900 text-blue-300 text-[11px] rounded-lg p-3 overflow-x-auto font-mono">{ep.response}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center py-8 text-xs text-gray-400">
          <p><strong>SunuBot API</strong> — Mémoire M2 IA — Université de Thiès — Adama GAYE</p>
          <p className="mt-1">Stack : Next.js 15 + FastAPI + PostgreSQL 14 + Prisma + mBERT + Mistral</p>
        </div>
      </main>
    </div>
  );
}
