/**
 * Database Client Export
 * 
 * Re-exports Prisma client for cleaner imports.
 * 
 * @module lib/db
 */

export { prisma as db } from "./prisma"
export { prisma } from "./prisma"
export type { PrismaClient } from "@prisma/client"
