import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { memoryDb } from "./memoryDb";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrisma() {
  console.log(" [DB] Creando instancia de base de datos...");
  if (process.env.USE_MOCK === "true") {
    console.log(" [DB] Modo: MOCK (Memory)");
    return memoryDb as any;
  }
  
  console.log(" [DB] Modo: REAL (Prisma + Neon)");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// In Next.js dev, we want to clear the global if it doesn't have our new models
if (globalForPrisma.prisma && !(globalForPrisma.prisma as any).workflow) {
  console.log(" [DB] Instancia global obsoleta detectada. Forzando recarga...");
  globalForPrisma.prisma = undefined as any;
}

export const db: any = globalForPrisma.prisma || (globalForPrisma.prisma = createPrisma());
export const prisma = db;

console.log(` [DB] Estado de modelos: workflow=${!!db.workflow}, systemSetting=${!!db.systemSetting}`);
