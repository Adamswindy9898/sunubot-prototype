// Client pour l'API NLP Python (FastAPI sur localhost:8000)

const NLP_API_URL = process.env.NLP_API_URL || "http://localhost:8000";

export interface AnalyseNLP {
  texte: string;
  analyse: {
    langue: {
      langue: "wolof" | "francais" | "mixte";
      score_wolof: number;
      score_francais: number;
      confiance: number;
      methode: string;
    };
    intention: {
      intention: string;
      confiance: number;
      top_3: Array<{ intention: string; confiance: number }>;
      domaine: string;
    };
    entites: {
      documents: string[];
      lieux: string[];
      montants: string[];
      dates: string[];
    };
    action_mcp: {
      serveur: string | null;
      tools: string[];
      formulaire: string | null;
      description: string;
    };
  };
}

export async function analyserMessage(texte: string): Promise<AnalyseNLP> {
  const response = await fetch(`${NLP_API_URL}/analyser`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texte }),
  });

  if (!response.ok) {
    throw new Error(`NLP API error: ${response.status}`);
  }

  return response.json();
}

export async function checkNLPHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${NLP_API_URL}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    const data = await response.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}
