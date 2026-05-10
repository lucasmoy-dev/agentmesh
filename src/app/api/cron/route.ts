import { NextRequest, NextResponse } from "next/server";
import { checkAndRunWorkflows } from "@/lib/scheduler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  // Opcional: Validar CRON_SECRET de Vercel
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new NextResponse('Unauthorized', { status: 401 });
  // }

  const origin = new URL(request.url).origin;
  
  console.log(" [CRON] Ejecutando verificación de triggers programados...");
  await checkAndRunWorkflows(origin);

  return NextResponse.json({ 
    success: true, 
    timestamp: new Date().toISOString(),
    message: "Check completed" 
  });
}
