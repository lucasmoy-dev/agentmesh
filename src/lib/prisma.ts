import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { memoryDb } from "./memoryDb";

// Helper to log DB state
const logDb = (msg: string) => console.log(` [DB_DEBUG] ${msg}`);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: any = null;

if (process.env.USE_MOCK !== "true") {
  if (globalForPrisma.prisma) {
    logDb("Reutilizando instancia de Prisma de Global");
    prismaInstance = globalForPrisma.prisma;
  } else {
    try {
      logDb("Iniciando nueva instancia de Prisma Client");
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const adapter = new PrismaPg(pool);
      prismaInstance = new PrismaClient({ 
        adapter,
        log: ["error"]
      });
      
      if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = prismaInstance;
      }
    } catch (e: any) {
      logDb(`Error fatal inicializando Prisma: ${e.message}`);
    }
  }
}

// Exportación defensiva
export const db: any = process.env.USE_MOCK === "true" ? memoryDb : (prismaInstance || memoryDb);

if (!db) {
  logDb("CRITICAL: 'db' export is undefined. Falling back to memoryDb safely.");
}

export { prismaInstance as prisma };
