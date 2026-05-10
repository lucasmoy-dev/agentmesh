import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "data", "config.json");

// Asegurar que el directorio data existe
if (!fs.existsSync(path.join(process.cwd(), "data"))) {
  fs.mkdirSync(path.join(process.cwd(), "data"));
}

export async function GET() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json({});
    }
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: "No se pudo leer la configuración" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newConfig = await request.json();
    
    // Leer config actual si existe para mezclar
    let currentConfig = {};
    if (fs.existsSync(CONFIG_PATH)) {
      currentConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    }

    const config = { ...currentConfig, ...newConfig };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "No se pudo guardar la configuración" }, { status: 500 });
  }
}
