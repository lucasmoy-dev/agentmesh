import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { addMinutes } from "date-fns";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get("password");

  if (password !== process.env.API_PASSWORD) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();

  // Find a prompt that is enabled and due
  const prompt = await db.prompt.findFirst({
    where: {
      enabled: true,
      nextExecutionAt: {
        lte: now,
      },
    },
    orderBy: {
      nextExecutionAt: "asc",
    },
  });

  if (!prompt) {
    return NextResponse.json({ status: "no_prompts_due" });
  }


  return NextResponse.json({
    id: prompt.id,
    slug: prompt.slug,
    content: prompt.content,
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    }
  });
}
