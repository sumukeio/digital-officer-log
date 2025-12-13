import { PrismaClient } from '@prisma/client';

// 1. 声明全局类型，防止 TypeScript 报错
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 2. 如果全局已有实例则复用，否则新建
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// 3. 仅在非生产环境将实例挂载到全局
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}