import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Obtener el workflow con sus nodos y las últimas 5 ejecuciones
    const workflow = await db.workflow.findUnique({
      where: { id },
      include: {
        nodes: true,
        executions: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            steps: {
              orderBy: { createdAt: "asc" }
            }
          }
        }
      }
    });

    if (!workflow) {
      return new NextResponse("Workflow no encontrado", { status: 404 });
    }

    return NextResponse.json({
      success: true,
      nodes: workflow.nodes,
      executions: workflow.executions
    });
  } catch (error: any) {
    console.error(" [WORKFLOW EXECUTIONS API ERROR]", error);
    return new NextResponse("Error al obtener ejecuciones", { status: 500 });
  }
}
