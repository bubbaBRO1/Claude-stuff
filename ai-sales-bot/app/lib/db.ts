import { PrismaClient } from "../generated/prisma";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma/dev.db");

function createClient() {
  const adapter = new PrismaBetterSQLite3({ url: dbPath });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
