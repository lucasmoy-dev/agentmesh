import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const workflows = await prisma.workflow.findMany({
    include: { nodes: true, edges: true }
  });
  console.log(JSON.stringify(workflows, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
