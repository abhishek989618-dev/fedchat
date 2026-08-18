import { prisma } from "./database.js";

async function main() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    console.log("PostgreSQL connection successful");
  } catch (error) {
    console.error("PostgreSQL connection failed");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();