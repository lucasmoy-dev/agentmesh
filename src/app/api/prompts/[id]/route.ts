import { db } from "@/lib/prisma";
import { calculateNextExecution, ScheduleConfig, ScheduleType } from "@/lib/scheduler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/prompts/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  return NextResponse.json(prompt, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    }
  });
}

// PATCH /api/prompts/[id] -> For editing
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
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

// POST /api/prompts/[id] -> For results (The Pi uses the slug as 'id' here)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get("password");
  const { id: idOrSlug } = await params;

  // Check password
  if (password !== process.env.API_PASSWORD) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const { result } = body;

  // Try to find by ID or Slug
  const prompt = await db.prompt.findUnique({
    where: idOrSlug.length > 20 ? { id: idOrSlug } : { slug: idOrSlug },
  });

  if (!prompt) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const now = new Date();
  
  // Calculate real next execution
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  await db.prompt.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
