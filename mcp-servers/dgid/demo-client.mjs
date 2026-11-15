import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(packageDir, "dist", "index.js");
const traceDir = path.join(packageDir, "traces");
const trace = {
  startedAt: new Date().toISOString(),
  client: { name: "sunubot-mcp-demo-client", version: "1.0.0" },
  serverCommand: process.execPath,
  serverArgs: [serverPath],
  transport: "stdio",
  dataSource: {
    type: "jeu_local_de_démonstration",
    source: "src/data.ts",
    connectedToOfficialDGID: false,
  },
  events: [],
};

function record(direction, message) {
  trace.events.push({
    at: new Date().toISOString(),
    direction,
    message: JSON.parse(JSON.stringify(message)),
  });
}

const serverTransport = new StdioClientTransport({
  command: process.execPath,
  args: [serverPath],
  cwd: packageDir,
  stderr: "pipe",
});

serverTransport.stderr?.on("data", (chunk) => {
  trace.events.push({
    at: new Date().toISOString(),
    direction: "server_stderr",
    text: chunk.toString("utf8").trim(),
  });
});

// Keep the official SDK transport, while recording JSON-RPC messages both ways.
const transport = {
  start: (...args) => serverTransport.start(...args),
  send: (message) => {
    record("client_to_server", message);
    return serverTransport.send(message);
  },
  close: (...args) => serverTransport.close(...args),
  get onmessage() {
    return serverTransport.onmessage;
  },
  set onmessage(handler) {
    serverTransport.onmessage = (message) => {
      record("server_to_client", message);
      handler?.(message);
    };
  },
  get onerror() {
    return serverTransport.onerror;
  },
  set onerror(handler) {
    serverTransport.onerror = handler;
  },
  get onclose() {
    return serverTransport.onclose;
  },
  set onclose(handler) {
    serverTransport.onclose = handler;
  },
};

const client = new Client({ name: trace.client.name, version: trace.client.version });
let exitCode = 0;

try {
  await client.connect(transport);
  trace.server = client.getServerVersion() ?? null;

  const { tools } = await client.listTools();
  trace.discoveredTools = tools.map(({ name, description }) => ({ name, description }));

  const requestedTool = "get_centre_fiscal";
  if (!tools.some((tool) => tool.name === requestedTool)) {
    throw new Error(`Outil MCP introuvable: ${requestedTool}`);
  }

  trace.demoCall = {
    name: requestedTool,
    arguments: { region: "Thiès" },
  };
  trace.demoResult = await client.callTool({
    name: requestedTool,
    arguments: trace.demoCall.arguments,
  });
  trace.completedAt = new Date().toISOString();
} catch (error) {
  exitCode = 1;
  trace.error = error instanceof Error ? error.message : String(error);
} finally {
  try {
    await client.close();
  } catch (error) {
    trace.closeError = error instanceof Error ? error.message : String(error);
    exitCode = 1;
  }
  await mkdir(traceDir, { recursive: true });
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const tracePath = path.join(traceDir, `mcp-exchange-${stamp}.json`);
  await writeFile(tracePath, `${JSON.stringify(trace, null, 2)}\n`, "utf8");
  console.log(`Trace MCP enregistrée : ${tracePath}`);
  console.log(`Événements JSON-RPC consignés : ${trace.events.filter((event) => event.message).length}`);
  if (trace.demoResult) {
    console.log(`Outil appelé : ${trace.demoCall.name}`);
    console.log(JSON.stringify(trace.demoResult, null, 2));
  }
}

process.exitCode = exitCode;
