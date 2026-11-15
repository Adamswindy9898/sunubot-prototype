import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";

export interface MCPTrace {
  trace_id: string;
  timestamp: string;
  session_id?: string;

  // 1. Requête client → orchestrateur
  client_request: {
    method: "POST";
    endpoint: "/api/chat";
    body: {
      message: string;
      langue_forcee?: string;
    };
  };

  // 2. Analyse NLP (langue + intention)
  nlp_analysis: {
    mode: "python_api" | "local_fallback";
    request_to_nlp?: {
      method: "POST";
      url: string;
      body: { texte: string };
    };
    response_from_nlp?: {
      langue: { langue: string; confiance?: number; methode?: string };
      intention: { intention: string; confiance?: number; domaine: string };
      entites?: Record<string, string[]>;
    };
    langue_finale: string;
    processing_time_ms: number;
  };

  // 3. Routage MCP : quel serveur, quels outils
  mcp_routing: {
    serveur_cible: string;
    tools_invoked: string[];
    description: string;
    formulaire?: string | null;
  };

  // 4. Réponse serveur MCP → client
  mcp_response: {
    status: "success" | "fallback" | "error";
    response_text: string;
    langue_reponse: string;
    intent_resolved: string;
    domaine_resolved?: string;
  };

  // 5. Enregistrement base de données
  db_log: {
    table: "ConversationLog";
    saved: boolean;
  };

  // 6. Temps total
  total_processing_time_ms: number;
}

// Utiliser globalThis pour persister entre les routes en dev mode Next.js
const globalTraces = globalThis as unknown as { __mcpTraces?: MCPTrace[] };
if (!globalTraces.__mcpTraces) {
  globalTraces.__mcpTraces = [];
}
let sessionTraces: MCPTrace[] = globalTraces.__mcpTraces;

export function generateTraceId(): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 6);
  return `MCP-${ts}-${rand}`;
}

export function createTrace(
  message: string,
  langue_forcee?: string
): MCPTrace {
  return {
    trace_id: generateTraceId(),
    timestamp: new Date().toISOString(),
    client_request: {
      method: "POST",
      endpoint: "/api/chat",
      body: { message, langue_forcee },
    },
    nlp_analysis: {
      mode: "local_fallback",
      langue_finale: "francais",
      processing_time_ms: 0,
    },
    mcp_routing: {
      serveur_cible: "orchestrateur",
      tools_invoked: [],
      description: "",
    },
    mcp_response: {
      status: "success",
      response_text: "",
      langue_reponse: "francais",
      intent_resolved: "",
    },
    db_log: {
      table: "ConversationLog",
      saved: false,
    },
    total_processing_time_ms: 0,
  };
}

export function addToSession(trace: MCPTrace) {
  sessionTraces.push(trace);
  if (sessionTraces.length > 100) {
    globalTraces.__mcpTraces = sessionTraces.slice(-100);
    sessionTraces = globalTraces.__mcpTraces;
  }
}

export function getSessionTraces(): MCPTrace[] {
  return [...sessionTraces];
}

export function clearSessionTraces() {
  globalTraces.__mcpTraces = [];
  sessionTraces = globalTraces.__mcpTraces;
}

const TRACES_DIR = path.join(
  process.cwd(),
  "..",
  "docs",
  "traces"
);

export async function saveTracesToFile(): Promise<string> {
  await mkdir(TRACES_DIR, { recursive: true });

  const date = new Date().toISOString().slice(0, 10);
  const filename = `mcp-traces-${date}.json`;
  const filepath = path.join(TRACES_DIR, filename);

  let existing: MCPTrace[] = [];
  try {
    const content = await readFile(filepath, "utf-8");
    existing = JSON.parse(content);
  } catch {
    // file doesn't exist yet
  }

  const all = [...existing, ...sessionTraces];
  await writeFile(filepath, JSON.stringify(all, null, 2), "utf-8");

  const count = sessionTraces.length;
  globalTraces.__mcpTraces = [];
  sessionTraces = globalTraces.__mcpTraces;
  return `${count} traces saved to ${filename}`;
}
