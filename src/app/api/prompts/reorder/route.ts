import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids)) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    // Actualizar el orden de cada prompt en una transacción
    await db.$transaction(
      ids.map((id: string, index: number) =>
        db.prompt.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering prompts:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
