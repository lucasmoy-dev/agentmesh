import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(request: NextRequest, props: { params: Promise<{ promptId: string }> }) {
  const params = await props.params;
  const id = params.promptId;
  
  const prompt = await db.prompt.findUnique({
    where: id.length > 20 ? { id } : { slug: id },
  });

  if (!prompt) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const updated = await db.prompt.update({
    where: { id: prompt.id },
    data: { 
      nextExecutionAt: new Date(),
      enabled: true 
    },
  });

  return NextResponse.json(updated);
}
