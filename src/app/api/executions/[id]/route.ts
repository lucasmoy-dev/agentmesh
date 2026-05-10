import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const execution = await db.workflowExecution.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!execution) {
      return NextResponse.json({ success: false, error: "Ejecución no xencontrada" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: execution.status,
      steps: execution.steps.map((s: any) => ({
        nodeId: s.nodeId,
        status: s.status,
        output: s.output,
        finishedAt: s.finishedAt
      }))
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
