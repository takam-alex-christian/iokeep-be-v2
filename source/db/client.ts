import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

import { database_url } from "../config/config";

const adapter = new PrismaPg({ connectionString: database_url });

const prisma = new PrismaClient({ adapter });

async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();

    if (process.env.NODE_ENV === "development") {
      console.log("PostgreSQL connected (Prisma)");
    }
  } catch (err) {
    console.log(err);
  }
}

export { prisma, connectDatabase };
