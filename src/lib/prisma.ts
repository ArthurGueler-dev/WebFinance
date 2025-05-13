import { PrismaClient } from '@prisma/client';

// Fallback for DATABASE_URL if not set in environment
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Arthur22@localhost:5432/financas_control';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Criar uma instância do PrismaClient com log detalhado
const prismaClientSingleton = () => {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
    log: ['query', 'info', 'warn', 'error'],
  });
  
  return client;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma; 