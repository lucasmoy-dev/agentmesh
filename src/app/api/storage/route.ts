import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { label, content } = await request.json();
    if (!label) return new NextResponse("Label is required", { status: 400 });

    const storedData = await db.storedData.upsert({
      where: { label },
      update: { content, updatedAt: new Date() },
      create: { label, content },
    });

    return NextResponse.json(storedData);
  } catch (error: any) {
    console.error("[STORAGE POST ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const label = searchParams.get("label");

    if (label) {
      const data = await db.storedData.findUnique({ where: { label } });
      return NextResponse.json(data);
    }

    // Manejo resiliente de findMany (especialmente para memoryDb)
    let allData = [];
    try {
      allData = await db.storedData.findMany({
        orderBy: { updatedAt: "desc" }
      });
    } catch (e) {
      // Fallback si el orderBy falla en mocks
      allData = await db.storedData.findMany();
    }
    
    return NextResponse.json(allData || []);
  } catch (error: any) {
    console.error("[STORAGE GET ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
