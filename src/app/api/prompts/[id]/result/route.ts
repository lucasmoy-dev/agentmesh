/* eslint-disable */
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

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

  const resultText = prompt.lastResult && prompt.lastResult !== "null" 
    ? String(prompt.lastResult) 
    : "Aún no hay resultados para este prompt.";

  return new NextResponse(resultText, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    }
  });
}
