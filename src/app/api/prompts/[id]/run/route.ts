import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const prompt = await db.prompt.findUnique({
    where: id.length > 20 ? { id } : { slug: id },
  });

  if (!prompt) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Llamada a Gemini
  let geminiResult = "";
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt.content }] }]
        }),
      }
    );

    const data = await response.json();
    geminiResult = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error: No se recibió respuesta de Gemini.";
  } catch (error) {
    console.error("Gemini Error:", error);
    geminiResult = "Error al conectar con Gemini.";
  }

  const updated = await db.prompt.update({
    where: { id: prompt.id },
    data: { 
      lastResult: geminiResult,
      lastExecutedAt: new Date(),
      enabled: true 
    },
  });

  return NextResponse.json({ success: true, result: geminiResult });
}
