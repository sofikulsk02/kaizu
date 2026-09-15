import { prisma } from "./prisma";

export function getPrismaClient() {
  return prisma;
}
