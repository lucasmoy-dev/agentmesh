import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { memoryDb } from "./memoryDb";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrisma() {
  if (process.env.USE_MOCK === "true") return memoryDb as any;
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const db: any = globalForPrisma.prisma || (globalForPrisma.prisma = createPrisma());
export const prisma = db;
