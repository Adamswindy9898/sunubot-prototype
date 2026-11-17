import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.ADMIN_PASSWORD || "admin2024"}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const conversations = await prisma.conversationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const escape = (s: string) => `"${(s || "").replace(/"/g, '""').replace(/\n/g, " ")}"`;

  const header = "id,date,langue,intent,domaine,compte_id,ip,message";
  const rows = conversations.map((c) =>
    [
      c.id,
      c.createdAt.toISOString(),
      c.langue,
      c.intent || "",
      c.domaine || "",
      c.compteId || "",
      c.ip || "",
      escape(c.message),
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sunubot_conversations_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
