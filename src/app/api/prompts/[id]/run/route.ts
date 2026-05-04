import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(request: NextRequest, context: any) {
  const params = await context.params;
  const id = params.id;
  
  // Find by ID or Slug
  const prompt = await db.prompt.findUnique({
    where: id.length > 20 ? { id } : { slug: id },
  });

  if (!prompt) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Force manual execution by setting nextExecutionAt to now
  const updated = await db.prompt.update({
    where: { id: prompt.id },
    data: { 
      nextExecutionAt: new Date(),
      enabled: true 
    },
  });

  return NextResponse.json(updated);
}
