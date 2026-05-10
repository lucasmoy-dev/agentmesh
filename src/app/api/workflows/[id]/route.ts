import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workflow = await db.workflow.findUnique({
    where: { id },
    include: {
      nodes: true,
      edges: true
    }
  });

  if (!workflow) return new NextResponse("Not Found", { status: 404 });
  return NextResponse.json(workflow);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, nodes, edges, enabled } = await request.json();

    // Actualizar el workflow (nombre y estado)
    await db.workflow.update({
      where: { id },
      data: { 
        name: name !== undefined ? name : undefined,
        enabled: enabled !== undefined ? enabled : undefined
      }
    });

    // Sincronización de nodos y edges si se envían
    if (nodes && edges) {
      await db.$transaction([
        db.node.deleteMany({ where: { workflowId: id } }),
        db.edge.deleteMany({ where: { workflowId: id } }),
        
        db.node.createMany({
          data: nodes.map((n: any) => ({
            id: n.id,
            workflowId: id,
            type: n.type || "DEFAULT",
            name: n.data.label || n.type,
            config: n.data || {},
            positionX: n.position.x,
            positionY: n.position.y
          }))
        }),
        
        db.edge.createMany({
          data: edges.map((e: any) => ({
            id: e.id,
            workflowId: id,
            sourceNodeId: e.source,
            targetNodeId: e.target
          }))
        })
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error saving workflow", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.workflow.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error deleting workflow", { status: 500 });
  }
}
