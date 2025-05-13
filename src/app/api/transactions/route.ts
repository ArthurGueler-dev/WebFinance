import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
// Importar as funções do db-fix
import { getTransactions, getCreditCards } from '@/lib/db-fix';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { RecurrenceType, TransactionType } from '@prisma/client';

// GET - Listar transações
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const description = searchParams.get('description');
    const categoryId = searchParams.get('categoryId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const creditCardId = searchParams.get('creditCardId');
    
    // Usar a função getTransactions do db-fix em vez do acesso direto ao Prisma
    const options: any = {};
    
    if (categoryId) {
      options.categoryId = categoryId;
    }
    
    if (creditCardId) {
      options.creditCardId = creditCardId;
    }
    
    if (startDate) {
      options.startDate = new Date(startDate);
    }
    
    if (endDate) {
      options.endDate = new Date(endDate);
    }
    
    // Buscar transações usando a função adaptada do db-fix
    let transactions = await getTransactions(session.user.id, options);
    
    // Filtrar por descrição (já que não temos essa opção na função getTransactions)
    if (description) {
      transactions = transactions.filter(t => 
        t.description.toLowerCase().includes(description.toLowerCase())
      );
    }
    
    // Verificar quais são transações de vale alimentação
    const transactionsJson = JSON.parse(JSON.stringify(transactions));
    
    // Buscar cartões de vale alimentação
    const foodVoucherCards = await prisma.creditCard.findMany({
      where: {
        userId: session.user.id,
        name: { contains: '[Vale Alimentação]' }
      },
      select: { id: true }
    });
    
    const foodVoucherCardIds = new Set(foodVoucherCards.map(card => card.id));
    
    // Converter transações DEBIT com cartão de vale alimentação para FOOD_VOUCHER
    transactionsJson.forEach((transaction: any) => {
      if (transaction.paymentMethod === 'DEBIT' && transaction.creditCardId && foodVoucherCardIds.has(transaction.creditCardId)) {
        transaction.paymentMethod = 'FOOD_VOUCHER';
      }
    });
    
    return NextResponse.json(transactionsJson);
  } catch (error) {
    console.error('Erro ao listar transações:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
}

// POST - Criar transação
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // Salvar o paymentMethod original antes de converter
    const originalPaymentMethod = data.paymentMethod;
    
    // Converter FOOD_VOUCHER para um valor de enum aceito (DEBIT como alternativa)
    let paymentMethod = data.paymentMethod;
    if (paymentMethod === 'FOOD_VOUCHER') {
      paymentMethod = 'DEBIT';
      console.log("Convertendo FOOD_VOUCHER para DEBIT temporariamente");
    }
    
    let transaction;
    
    // Se for uma transação parcelada, criar múltiplas transações
    if (data.recurrenceType === 'INSTALLMENT' && data.installments > 1) {
      const installmentAmount = Math.round((data.amount / data.installments) * 100) / 100;
      
      // Criar transações para cada parcela
      const transactionPromises = [];
      
      for (let i = 1; i <= data.installments; i++) {
        const installmentDate = new Date(data.date);
        installmentDate.setMonth(installmentDate.getMonth() + i - 1);
        
        transactionPromises.push(
          prisma.transaction.create({
            data: {
              description: `${data.description} (${i}/${data.installments})`,
              amount: installmentAmount,
              date: installmentDate,
              type: data.type as TransactionType,
              paymentMethod: paymentMethod,
              categoryId: data.categoryId,
              bankAccountId: data.bankAccountId,
              creditCardId: data.creditCardId,
              recurrenceType: 'INSTALLMENT' as RecurrenceType,
              installments: data.installments,
              currentInstallment: i,
              userId: session.user.id,
            },
          })
        );
      }
      
      await Promise.all(transactionPromises);
      
      // Obter a primeira transação para a resposta
      transaction = await prisma.transaction.findFirst({
        where: {
          userId: session.user.id,
          description: `${data.description} (1/${data.installments})`,
          recurrenceType: 'INSTALLMENT',
          installments: data.installments,
          currentInstallment: 1,
        },
        include: {
          category: true,
          bankAccount: true,
          creditCard: true,
        },
      });
    } else {
      // Transação única ou recorrente
      transaction = await prisma.transaction.create({
        data: {
          description: data.description,
          amount: data.amount,
          date: new Date(data.date),
          type: data.type as TransactionType,
          paymentMethod: paymentMethod,
          categoryId: data.categoryId,
          bankAccountId: data.bankAccountId,
          creditCardId: data.creditCardId,
          recurrenceType: data.recurrenceType as RecurrenceType,
          installments: data.recurrenceType === 'INSTALLMENT' ? data.installments : null,
          currentInstallment: data.recurrenceType === 'INSTALLMENT' ? 1 : null,
          userId: session.user.id,
        },
        include: {
          category: true,
          bankAccount: true,
          creditCard: true,
        },
      });
    }
    
    // Restaurar FOOD_VOUCHER na resposta
    const responseTransaction = {
      ...JSON.parse(JSON.stringify(transaction)),
      paymentMethod: originalPaymentMethod
    };
    
    // Atualizar o saldo da conta bancária se informada
    if (data.bankAccountId) {
      await updateBankAccountBalance(data.bankAccountId);
    }
    
    return NextResponse.json(responseTransaction);
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
}

// Função para atualizar o saldo da conta bancária
async function updateBankAccountBalance(accountId: string) {
  // Buscar todas as transações relacionadas à conta
  const transactions = await prisma.transaction.findMany({
    where: {
      bankAccountId: accountId,
    },
  });
  
  // Obter a conta bancária
  const account = await prisma.bankAccount.findUnique({
    where: {
      id: accountId,
    },
  });
  
  if (!account) return;
  
  // Calcular o novo saldo atual (saldo inicial + soma das transações)
  const transactionsSum = transactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );
  
  // Atualizar o saldo atual da conta
  await prisma.bankAccount.update({
    where: {
      id: accountId,
    },
    data: {
      currentBalance: account.initialBalance + transactionsSum,
    },
  });
} 