import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient } from "../generated/prisma/client.js"
import { env } from "../config/env.js"

const databaseUrl = new URL(env.DATABASE_URL)

if (
  env.NODE_ENV !== "production" &&
  !databaseUrl.searchParams.has("allowPublicKeyRetrieval")
) {
  databaseUrl.searchParams.set("allowPublicKeyRetrieval", "true")
}

const adapter = new PrismaMariaDb(databaseUrl.toString())

export const prisma = new PrismaClient({ adapter })
