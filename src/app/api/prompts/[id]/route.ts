/* eslint-disable */
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { calculateNextExecution, ScheduleConfig, ScheduleType } from "@/lib/scheduler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const password = searchParams.get("password");

  if (password !== process.env.API_KEY_HASH) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  
  const prompt = await db.prompt.findFirst({
    where: {
      OR: [
        { id: id },
        { slug: id }
      ]
    },
  });

  if (!prompt) {
    return new NextResponse("Error: Prompt no encontrado.", { status: 404 });
  }

  return new NextResponse(prompt.content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    }
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  // Buscar por ID o Slug para obtener el ID real
  const existingPrompt = await db.prompt.findFirst({
    where: {
      OR: [{ id: id }, { slug: id }]
    }
  });

  if (!existingPrompt) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const config: ScheduleConfig = {
    type: data.scheduleType as ScheduleType,
    time: data.scheduleTime,
    days: data.scheduleDays ? data.scheduleDays.split(",").map(Number) : undefined,
    date: data.scheduleDate,
    month: data.scheduleMonth,
    intervalValue: data.intervalValue,
    intervalUnit: data.intervalUnit,
  };

  const nextExecutionAt = calculateNextExecution(config);

  const updated = await db.prompt.update({
    where: { id: existingPrompt.id },
    data: {
      ...data,
      nextExecutionAt,
    },
  });

  return NextResponse.json(updated);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: identifier } = await params;
  
  const { searchParams } = new URL(request.url);
  const password = searchParams.get("password");

  if (password !== process.env.API_KEY_HASH) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const { result } = body;

  const prompt = await db.prompt.findFirst({
    where: {
      OR: [
        { id: identifier },
        { slug: identifier }
      ]
    },
  });

  if (!prompt) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const now = new Date();
  const config: ScheduleConfig = {
    type: prompt.scheduleType as ScheduleType,
    days: prompt.scheduleDays ? prompt.scheduleDays.split(",").map(Number) : undefined,
    time: prompt.scheduleTime,
    date: prompt.scheduleDate || undefined,
    month: prompt.scheduleMonth || undefined,
    intervalValue: prompt.intervalValue || undefined,
    intervalUnit: (prompt.intervalUnit as any) || undefined,
  };

  const nextExecution = calculateNextExecution(config, now);

  await db.prompt.update({
    where: { id: prompt.id },
    data: {
      lastResult: result,
      lastExecutedAt: now,
      nextExecutionAt: nextExecution,
      enabled: prompt.scheduleType === "SINGLE" ? false : true,
    },
  });

  return NextResponse.json({ success: true, nextExecutionAt: nextExecution });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Buscar por ID o Slug
  const existingPrompt = await db.prompt.findFirst({
    where: {
      OR: [{ id: id }, { slug: id }]
    }
  });

  if (!existingPrompt) {
    return new NextResponse("Not Found", { status: 404 });
  }

  await db.prompt.delete({ where: { id: existingPrompt.id } });
  return new NextResponse(null, { status: 204 });
}
