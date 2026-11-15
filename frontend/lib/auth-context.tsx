"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { ComptePublic } from "@/components/AuthModal";

interface AuthContextType {
  compte: ComptePublic | null;
  token: string | null;
  isLoading: boolean;
  login: (compte: ComptePublic, token: string) => void;
  logout: () => Promise<void>;
  refreshCompte: () => Promise<void>;
  ajouterDemande: (params: {
    type: string; service: string; reference: string; details: Record<string, string>;
  }) => Promise<{ success: boolean; reference?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [compte, setCompte] = useState<ComptePublic | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurer la session au démarrage
  useEffect(() => {
    const savedToken = localStorage.getItem("sunubot_token");
    if (savedToken) {
      setToken(savedToken);
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setCompte(data.compte);
          else { localStorage.removeItem("sunubot_token"); setToken(null); }
        })
        .catch(() => { localStorage.removeItem("sunubot_token"); setToken(null); })
        .finally(() => setIsLoading(false));
    } else {
      // Vérifier le cookie httpOnly via /api/auth/me
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((data) => { if (data.success) setCompte(data.compte); })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, []);

  const login = useCallback((c: ComptePublic, t: string) => {
    setCompte(c);
    setToken(t);
    localStorage.setItem("sunubot_token", t);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCompte(null);
    setToken(null);
    localStorage.removeItem("sunubot_token");
  }, []);

  const refreshCompte = useCallback(async () => {
    const t = token || localStorage.getItem("sunubot_token");
    if (!t) return;
    const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } });
    const data = await res.json();
    if (data.success) setCompte(data.compte);
  }, [token]);

  const ajouterDemande = useCallback(async (params: {
    type: string; service: string; reference: string; details: Record<string, string>;
  }) => {
    const t = token || localStorage.getItem("sunubot_token");
    if (!t || !compte) return { success: false, error: "Non connecté" };

    const res = await fetch("/api/auth/demandes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (data.success) {
      // Rafraîchir le compte pour mettre à jour la liste des demandes
      await refreshCompte();
      return { success: true, reference: params.reference };
    }
    return { success: false, error: data.error };
  }, [token, compte, refreshCompte]);

  return (
    <AuthContext.Provider value={{ compte, token, isLoading, login, logout, refreshCompte, ajouterDemande }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
