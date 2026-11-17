import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface ServiceStatus {
  status: "ok" | "error";
  latency_ms: number;
  detail?: string;
}

async function checkPostgres(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", latency_ms: Date.now() - start };
  } catch (e: unknown) {
    return { status: "error", latency_ms: Date.now() - start, detail: e instanceof Error ? e.message : "unknown" };
  }
}

async function checkNLP(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const res = await fetch("http://localhost:8000/health", { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    return { status: data.status === "ok" ? "ok" : "error", latency_ms: Date.now() - start, detail: data.mode };
  } catch (e: unknown) {
    return { status: "error", latency_ms: Date.now() - start, detail: e instanceof Error ? e.message : "unreachable" };
  }
}

async function checkMistral(): Promise<ServiceStatus> {
  const start = Date.now();
  const key = process.env.MISTRAL_API_KEY;
  if (!key) return { status: "error", latency_ms: 0, detail: "MISTRAL_API_KEY not set" };
  try {
    const res = await fetch("https://api.mistral.ai/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    return { status: res.ok ? "ok" : "error", latency_ms: Date.now() - start, detail: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e: unknown) {
    return { status: "error", latency_ms: Date.now() - start, detail: e instanceof Error ? e.message : "unreachable" };
  }
}

export async function GET() {
  const [postgres, nlp, mistral] = await Promise.all([checkPostgres(), checkNLP(), checkMistral()]);

  const allOk = postgres.status === "ok" && nlp.status === "ok" && mistral.status === "ok";

  return NextResponse.json({
    status: allOk ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    services: { postgres, nlp, mistral },
    uptime_seconds: Math.floor(process.uptime()),
  }, { status: allOk ? 200 : 503 });
}
