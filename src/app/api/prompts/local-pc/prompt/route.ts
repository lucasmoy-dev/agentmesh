import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

async function getSettings() {
  const settings = await db.systemSetting.findMany();
  const config: Record<string, string> = {};
  settings.forEach((s: any) => { config[s.key] = s.value; });
  return config;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const apikey = searchParams.get("apikey");

  const settings = await getSettings();
  if (!settings.LOCAL_PC_API_KEY || apikey !== settings.LOCAL_PC_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Buscar el paso más antiguo que esté esperando por ejecución local
  const step = await db.executionStep.findFirst({
    where: { status: "WAITING_LOCAL" },
    orderBy: { createdAt: "asc" }
  });

  if (!step) {
    return NextResponse.json({ message: "No prompts pending" });
  }

  return NextResponse.json({
    id: step.id,
    prompt: step.output // En WAITING_LOCAL, guardamos el prompt en 'output'
  });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const apikey = searchParams.get("apikey");

  const settings = await getSettings();
  if (!settings.LOCAL_PC_API_KEY || apikey !== settings.LOCAL_PC_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, result } = await request.json();

  if (!id || !result) {
    return NextResponse.json({ error: "Missing id or result" }, { status: 400 });
  }

  try {
    await db.executionStep.update({
      where: { id },
      data: {
        output: result,
        status: "COMPLETED",
        finishedAt: new Date()
      }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
