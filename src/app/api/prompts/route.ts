import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { calculateNextExecution, ScheduleConfig, ScheduleType } from "@/lib/scheduler";

export async function GET() {
  const prompts = await db.prompt.findMany();
  return NextResponse.json(prompts);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, content, scheduleType, scheduleTime, scheduleDays, scheduleDate } = body;

    const config: ScheduleConfig = {
      type: scheduleType as ScheduleType,
      time: scheduleTime,
      days: scheduleDays ? scheduleDays.split(",").map(Number) : undefined,
      date: scheduleDate,
    };

    const nextExecutionAt = calculateNextExecution(config);

    const prompt = await db.prompt.create({
      data: {
        name,
        slug,
        content,
        scheduleType,
        scheduleTime,
        scheduleDays,
        scheduleDate,
        nextExecutionAt,
      },
    });

    return NextResponse.json(prompt);
  } catch (error) {
    console.error(error);
    return new NextResponse("Error creating prompt", { status: 500 });
  }
}
