import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // id es el executionId
  const { nodeId } = await request.json();

  try {
    // Buscamos el paso que está en WAITING para ese nodo en esa ejecución
    const step = await db.executionStep.findFirst({
      where: {
        executionId: id,
        nodeId: nodeId,
        status: "WAITING"
      }
    });

    if (!step) {
      return NextResponse.json({ success: false, error: "Paso de ejecución no encontrado o no está esperando confirmación." }, { status: 404 });
    }

    // Actualizamos a COMPLETED para que el motor en background continúe
    await db.executionStep.update({
      where: { id: step.id },
      data: { status: "COMPLETED", finishedAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
