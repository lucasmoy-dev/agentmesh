import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    
    const workflow = await db.workflow.create({
      data: {
        name: name || "Nuevo Workflow",
        description: "Creado desde el dashboard",
        nodes: {
          create: [
            {
              name: "Inicio Manual",
              type: "TRIGGER_MANUAL",
              positionX: 250,
              positionY: 5,
              config: {}
            }
          ]
        }
      }
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error(error);
    return new NextResponse("Error creating workflow", { status: 500 });
  }
}

export async function GET() {
  const workflows = await db.workflow.findMany({
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(workflows);
}
