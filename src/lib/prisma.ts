import { PrismaClient } from "@prisma/client";
import { memoryDb } from "./memoryDb";

const globalForPrisma = global as unknown as { prisma: PrismaClient | null };

let prisma: any = null;

if (process.env.USE_MOCK !== "true") {
  prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
      log: ["query"],
    });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
}

// Export the database interface
export const db = process.env.USE_MOCK === "true" ? memoryDb : prisma;
export { prisma };
