import { PrismaClient } from "@prisma/client";
// Force reload to pick up new models
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { memoryDb } from "./memoryDb";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
// Clear cache to force refresh models
globalForPrisma.prisma = undefined as any;

let prisma: PrismaClient = undefined as any;

if (process.env.USE_MOCK !== "true") {
  if (globalForPrisma.prisma) {
    prisma = globalForPrisma.prisma;
  } else {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ 
      adapter,
      log: ["query"]
    });
    
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prisma;
    }
  }
}

// Export the database interface
export const db = process.env.USE_MOCK === "true" ? memoryDb : prisma;
export { prisma };
