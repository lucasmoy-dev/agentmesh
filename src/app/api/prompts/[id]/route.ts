import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { calculateNextExecution, ScheduleConfig, ScheduleType } from "@/lib/scheduler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/prompts/[id]
export async function GET(request: NextRequest, context: any) {
  const params = await context.params;
  const id = params.id;
  
  const prompt = await db.prompt.findUnique({
    where: { id },
  });

  return NextResponse.json(prompt, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    }
  });
}

// PATCH /api/prompts/[id]
export async function PATCH(request: NextRequest, context: any) {
  const params = await context.params;
  const id = params.id;
  const data = await request.json();

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
    where: { id },
    data: {
      ...data,
      nextExecutionAt,
    },
  });

  return NextResponse.json(updated);
}

// POST /api/prompts/[id]
export async function POST(request: NextRequest, context: any) {
  const params = await context.params;
  const idOrSlug = params.id;
  
  const { searchParams } = new URL(request.url);
  const password = searchParams.get("password");

  if (password !== process.env.API_PASSWORD) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const { result } = body;

  const prompt = await db.prompt.findUnique({
    where: idOrSlug.length > 20 ? { id: idOrSlug } : { slug: idOrSlug },
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

// DELETE /api/prompts/[id]
export async function DELETE(request: NextRequest, context: any) {
  const params = await context.params;
  const id = params.id;
  await db.prompt.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
