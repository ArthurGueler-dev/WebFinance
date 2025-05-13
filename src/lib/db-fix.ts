/**
 * IMPORTANTE: Este arquivo contém funções adaptadas para o acesso ao banco de dados
 * enquanto a migração para adicionar a coluna "color" ao modelo CreditCard não é aplicada.
 * 
 * Como usar:
 * 1. Importe as funções deste arquivo em vez de usar o prisma diretamente:
 *    import { getTransactions, getCreditCards, getBudgets } from '@/lib/db-fix';
 * 
 * 2. Use essas funções em vez de chamadas diretas ao prisma:
 *    - Em vez de prisma.transaction.findMany(), use getTransactions()
 *    - Em vez de prisma.creditCard.findMany(), use getCreditCards()
 *    - Em vez de prisma.budget.findMany(), use getBudgets()
 * 
 * Após aplicar a migração completa no banco de dados, este arquivo pode ser removido
 * e o código pode voltar a usar o prisma diretamente.
 */

// Script para corrigir temporariamente o acesso ao banco de dados
// enquanto a migração não é aplicada

import { PrismaClient, Prisma } from '@prisma/client';

// Fallback para DATABASE_URL se não estiver definido no ambiente
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Arthur22@localhost:5432/financas_control';

// Cria um novo cliente Prisma com log detalhado em desenvolvimento
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Funções adaptadas para lidar com as colunas faltantes

// Função para obter cartões de crédito sem depender da coluna color
export async function getCreditCards(userId: string) {
  try {
    // Consulta sql raw para evitar o uso da coluna color que não existe ainda no banco
    const creditCards = await prisma.$queryRaw`
      SELECT 
        id, name, "limit", "dueDay", "closingDay", "cardType", 
        "userId", "createdAt", "updatedAt"
      FROM "CreditCard" 
      WHERE "userId" = ${userId}
      ORDER BY name ASC
    `;
    
    // Adiciona a cor como NULL para compatibilidade com o front-end
    return (creditCards as any[]).map(card => ({
      ...card,
      color: null // Adiciona campo que está faltando no banco
    }));
  } catch (error) {
    console.error('Erro ao buscar cartões de crédito:', error);
    throw error;
  }
}

// Função para obter orçamentos com dados de categoria
export async function getBudgets(userId: string, month: number, year: number) {
  try {
    // Consulta SQL raw para obter orçamentos com dados de categoria
    const budgetsRaw = await prisma.$queryRaw`
      SELECT b.*, c.id as category_id, c.name as category_name, 
             c.color as category_color, c.icon as category_icon, 
             c.type as category_type, c."createdAt" as category_created_at
      FROM "Budget" b
      JOIN "Category" c ON b."categoryId" = c.id
      WHERE b."userId" = ${userId}
        AND b.month = ${month}
        AND b.year = ${year}
      ORDER BY c.name ASC
    `;
    
    // Para cada orçamento, calcular o valor gasto atual
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Buscar todas as transações do período
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        },
        type: 'EXPENSE'
      },
      select: {
        categoryId: true,
        amount: true
      }
    });
    
    // Agrupar transações por categoria
    const expensesByCategory: { [categoryId: string]: number } = {};
    transactions.forEach(transaction => {
      if (!expensesByCategory[transaction.categoryId]) {
        expensesByCategory[transaction.categoryId] = 0;
      }
      expensesByCategory[transaction.categoryId] += transaction.amount;
    });
    
    // Formatando orçamentos no formato esperado
    return (budgetsRaw as any[]).map(budget => {
      return {
        id: budget.id,
        categoryId: budget.categoryId,
        amount: budget.amount,
        month: budget.month,
        year: budget.year,
        userId: budget.userId,
        alertThreshold: budget.alertThreshold,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
        spentAmount: expensesByCategory[budget.categoryId] || 0,
        category: {
          id: budget.category_id,
          name: budget.category_name,
          color: budget.category_color,
          icon: budget.category_icon,
          type: budget.category_type,
          createdAt: budget.category_created_at
        }
      };
    });
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    throw error;
  }
}

// Função para obter um orçamento específico por ID
export async function getBudgetById(id: string, userId: string) {
  try {
    const budgetsRaw = await prisma.$queryRaw`
      SELECT b.*, c.id as category_id, c.name as category_name, 
             c.color as category_color, c.icon as category_icon, 
             c.type as category_type, c."createdAt" as category_created_at
      FROM "Budget" b
      JOIN "Category" c ON b."categoryId" = c.id
      WHERE b.id = ${id}
        AND b."userId" = ${userId}
      LIMIT 1
    `;
    
    const budgets = budgetsRaw as any[];
    
    if (budgets.length === 0) {
      return null;
    }
    
    return {
      id: budgets[0].id,
      categoryId: budgets[0].categoryId,
      amount: budgets[0].amount,
      month: budgets[0].month,
      year: budgets[0].year,
      userId: budgets[0].userId,
      alertThreshold: budgets[0].alertThreshold,
      createdAt: budgets[0].createdAt,
      updatedAt: budgets[0].updatedAt,
      category: {
        id: budgets[0].category_id,
        name: budgets[0].category_name,
        color: budgets[0].category_color,
        icon: budgets[0].category_icon,
        type: budgets[0].category_type,
        createdAt: budgets[0].category_created_at
      }
    };
  } catch (error) {
    console.error('Erro ao buscar orçamento por ID:', error);
    throw error;
  }
}

// Função para criar um novo orçamento
export async function createBudget(data: {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  alertThreshold?: number;
  userId: string;
}) {
  try {
    // Verificar se já existe um orçamento para esta categoria neste mês
    const existingBudgets = await prisma.$queryRaw`
      SELECT id FROM "Budget" 
      WHERE "userId" = ${data.userId}
        AND "categoryId" = ${data.categoryId}
        AND month = ${data.month}
        AND year = ${data.year}
    `;
    
    if ((existingBudgets as any[]).length > 0) {
      throw new Error("DUPLICATE_BUDGET");
    }
    
    // Criar novo orçamento usando raw query
    await prisma.$executeRaw`
      INSERT INTO "Budget" ("id", "categoryId", "amount", "month", "year", "alertThreshold", "userId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${data.categoryId}, ${data.amount}, ${data.month}, ${data.year}, ${data.alertThreshold || 80}, ${data.userId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    
    // Buscar o orçamento criado para retornar com os dados da categoria
    const newBudget = await prisma.$queryRaw`
      SELECT b.*, c.id as category_id, c.name as category_name, 
             c.color as category_color, c.icon as category_icon, 
             c.type as category_type, c."createdAt" as category_created_at
      FROM "Budget" b
      JOIN "Category" c ON b."categoryId" = c.id
      WHERE b."userId" = ${data.userId}
        AND b."categoryId" = ${data.categoryId}
        AND b.month = ${data.month}
        AND b.year = ${data.year}
      LIMIT 1
    `;
    
    return (newBudget as any[])[0];
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    throw error;
  }
}

// Função para atualizar um orçamento
export async function updateBudget(id: string, userId: string, data: {
  amount?: number;
  alertThreshold?: number;
}) {
  try {
    // Verificar se o orçamento existe e pertence ao usuário
    const existingBudgets = await prisma.$queryRaw`
      SELECT id FROM "Budget" 
      WHERE id = ${id}
        AND "userId" = ${userId}
    `;
    
    if ((existingBudgets as any[]).length === 0) {
      throw new Error("NOT_FOUND");
    }
    
    // Atualizar o orçamento
    await prisma.$executeRaw`
      UPDATE "Budget"
      SET 
        amount = ${data.amount ? data.amount : null},
        "alertThreshold" = ${data.alertThreshold ? data.alertThreshold : null},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
    
    // Buscar o orçamento atualizado
    const updatedBudgetsRaw = await prisma.$queryRaw`
      SELECT b.*, c.id as category_id, c.name as category_name, 
             c.color as category_color, c.icon as category_icon, 
             c.type as category_type, c."createdAt" as category_created_at
      FROM "Budget" b
      JOIN "Category" c ON b."categoryId" = c.id
      WHERE b.id = ${id}
      LIMIT 1
    `;
    
    const updatedBudgets = updatedBudgetsRaw as any[];
    
    return {
      id: updatedBudgets[0].id,
      categoryId: updatedBudgets[0].categoryId,
      amount: updatedBudgets[0].amount,
      month: updatedBudgets[0].month,
      year: updatedBudgets[0].year,
      userId: updatedBudgets[0].userId,
      alertThreshold: updatedBudgets[0].alertThreshold,
      createdAt: updatedBudgets[0].createdAt,
      updatedAt: updatedBudgets[0].updatedAt,
      category: {
        id: updatedBudgets[0].category_id,
        name: updatedBudgets[0].category_name,
        color: updatedBudgets[0].category_color,
        icon: updatedBudgets[0].category_icon,
        type: updatedBudgets[0].category_type,
        createdAt: updatedBudgets[0].category_created_at
      }
    };
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    throw error;
  }
}

// Função para excluir um orçamento
export async function deleteBudget(id: string, userId: string) {
  try {
    // Verificar se o orçamento existe e pertence ao usuário
    const existingBudgets = await prisma.$queryRaw`
      SELECT id FROM "Budget" 
      WHERE id = ${id}
        AND "userId" = ${userId}
    `;
    
    if ((existingBudgets as any[]).length === 0) {
      throw new Error("NOT_FOUND");
    }
    
    // Excluir o orçamento
    await prisma.$executeRaw`
      DELETE FROM "Budget"
      WHERE id = ${id}
    `;
    
    return true;
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    throw error;
  }
}

// Função para obter transações incluindo cartões, mas sem depender da coluna color
export async function getTransactions(userId: string, options?: { 
  limit?: number, 
  offset?: number,
  startDate?: Date,
  endDate?: Date,
  type?: 'INCOME' | 'EXPENSE',
  categoryId?: string,
  bankAccountId?: string,
  creditCardId?: string
}) {
  try {
    // Construir a condição WHERE base
    let whereConditions = `WHERE t."userId" = '${userId}'`;
    
    // Adicionar filtros opcionais
    if (options?.startDate) {
      whereConditions += ` AND t.date >= '${options.startDate.toISOString()}'`;
    }
    
    if (options?.endDate) {
      whereConditions += ` AND t.date <= '${options.endDate.toISOString()}'`;
    }
    
    if (options?.type) {
      whereConditions += ` AND t.type = '${options.type}'`;
    }
    
    if (options?.categoryId) {
      whereConditions += ` AND t."categoryId" = '${options.categoryId}'`;
    }
    
    if (options?.bankAccountId) {
      whereConditions += ` AND t."bankAccountId" = '${options.bankAccountId}'`;
    }
    
    if (options?.creditCardId) {
      whereConditions += ` AND t."creditCardId" = '${options.creditCardId}'`;
    }
    
    // Preparar partes da consulta SQL
    const whereClause = Prisma.sql([whereConditions]);
    const limitClause = options?.limit ? Prisma.sql([`LIMIT ${options.limit}`]) : Prisma.empty;
    const offsetClause = options?.offset ? Prisma.sql([`OFFSET ${options.offset}`]) : Prisma.empty;
    
    // Consulta SQL raw
    const transactions = await prisma.$queryRaw`
      SELECT 
        t.id, t.description, t.amount, t.date, t.type, t."paymentMethod", 
        t."recurrenceType", t.installments, t."currentInstallment",
        t."categoryId", t."userId", t."bankAccountId", t."creditCardId", 
        t."createdAt", t."updatedAt",
        c.id as "category_id", c.name as "category_name", 
        c.color as "category_color", c.icon as "category_icon", 
        c.type as "category_type", c."createdAt" as "category_createdAt",
        ba.id as "bankAccount_id", ba.name as "bankAccount_name", 
        ba."initialBalance" as "bankAccount_initialBalance", 
        ba."currentBalance" as "bankAccount_currentBalance",
        ba."userId" as "bankAccount_userId", 
        ba."createdAt" as "bankAccount_createdAt", 
        ba."updatedAt" as "bankAccount_updatedAt",
        cc.id as "creditCard_id", cc.name as "creditCard_name", 
        cc.limit as "creditCard_limit", cc."dueDay" as "creditCard_dueDay", 
        cc."closingDay" as "creditCard_closingDay", 
        cc."cardType" as "creditCard_cardType",
        cc."userId" as "creditCard_userId", 
        cc."createdAt" as "creditCard_createdAt", 
        cc."updatedAt" as "creditCard_updatedAt"
      FROM "Transaction" t
      LEFT JOIN "Category" c ON t."categoryId" = c.id
      LEFT JOIN "BankAccount" ba ON t."bankAccountId" = ba.id
      LEFT JOIN "CreditCard" cc ON t."creditCardId" = cc.id
      ${whereClause}
      ORDER BY t.date DESC
      ${limitClause}
      ${offsetClause}
    `;
    
    // Transformar os resultados no formato esperado
    return (transactions as any[]).map(t => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      date: t.date,
      type: t.type,
      paymentMethod: t.paymentMethod,
      recurrenceType: t.recurrenceType,
      installments: t.installments,
      currentInstallment: t.currentInstallment,
      categoryId: t.categoryId,
      userId: t.userId,
      bankAccountId: t.bankAccountId,
      creditCardId: t.creditCardId,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      category: t.category_id ? {
        id: t.category_id,
        name: t.category_name,
        color: t.category_color,
        icon: t.category_icon,
        type: t.category_type,
        createdAt: t.category_createdAt
      } : null,
      bankAccount: t.bankAccount_id ? {
        id: t.bankAccount_id,
        name: t.bankAccount_name,
        initialBalance: t.bankAccount_initialBalance,
        currentBalance: t.bankAccount_currentBalance,
        userId: t.bankAccount_userId,
        createdAt: t.bankAccount_createdAt,
        updatedAt: t.bankAccount_updatedAt
      } : null,
      creditCard: t.creditCard_id ? {
        id: t.creditCard_id,
        name: t.creditCard_name,
        limit: t.creditCard_limit,
        dueDay: t.creditCard_dueDay,
        closingDay: t.creditCard_closingDay,
        cardType: t.creditCard_cardType,
        userId: t.creditCard_userId,
        createdAt: t.creditCard_createdAt,
        updatedAt: t.creditCard_updatedAt,
        color: null // Adiciona o campo ausente no banco
      } : null
    }));
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    throw error;
  }
}

export default prisma; 