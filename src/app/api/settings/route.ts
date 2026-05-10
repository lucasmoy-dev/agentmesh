import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "data", "config.json");

// Helper para migrar datos del archivo a la DB una sola vez
async function migrateFileToDb() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      for (const [key, value] of Object.entries(config)) {
        await db.systemSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) }
        });
      }
      // Opcional: borrar el archivo después de migrar exitosamente
      // fs.unlinkSync(CONFIG_PATH); 
      console.log(" [MIGRATION] Settings migrados del archivo a la DB");
    } catch (e) {
      console.error("Error migrando config", e);
    }
  }
}

export async function GET() {
  try {
    await migrateFileToDb(); // Intentar migrar si existe el archivo
    
    const settings = await db.systemSetting.findMany();
    const config: Record<string, string> = {};
    settings.forEach((s: any) => {
      config[s.key] = s.value;
    });
    
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: "No se pudo leer la configuración de la DB" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newConfig = await request.json();
    
    for (const [key, value] of Object.entries(newConfig)) {
      if (value !== undefined) {
        await db.systemSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) }
        });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "No se pudo guardar la configuración en la DB" }, { status: 500 });
  }
}
