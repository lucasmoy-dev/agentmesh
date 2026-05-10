import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { label, content } = await request.json();
    
    const updated = await db.storedData.update({
      where: { id },
      data: { label, content }
    });
    
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.storedData.delete({
      where: { id }
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error deleting storage item", { status: 500 });
  }
}
