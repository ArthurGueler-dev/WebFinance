import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { RecurrenceType, TransactionType } from '@prisma/client';

// GET - Obter transação por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    const transaction = await prisma.transaction.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        category: true,
        bankAccount: true,
        creditCard: true,
      },
    });
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar transação
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    const data = await request.json();
    
    // Validar se a transação existe e pertence ao usuário
    const existingTransaction = await prisma.transaction.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }
    
    // Para transações recorrentes ou parceladas, pode ser necessário um tratamento especial
    const isRecurringOrInstallment = 
      existingTransaction.recurrenceType === 'RECURRING' || 
      existingTransaction.recurrenceType === 'INSTALLMENT';
    
    // Atualizar a transação
    const updatedTransaction = await prisma.transaction.update({
      where: {
        id,
      },
      data: {
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        type: data.type as TransactionType,
        paymentMethod: data.paymentMethod,
        categoryId: data.categoryId,
        bankAccountId: data.bankAccountId,
        creditCardId: data.creditCardId,
        recurrenceType: data.recurrenceType as RecurrenceType,
        installments: data.installments,
      },
      include: {
        category: true,
        bankAccount: true,
        creditCard: true,
      },
    });
    
    // Atualizar o saldo da conta bancária
    if (data.bankAccountId) {
      await updateBankAccountBalance(data.bankAccountId);
    }
    
    // Se a conta bancária foi alterada, também atualizar o saldo da conta anterior
    if (
      existingTransaction.bankAccountId && 
      existingTransaction.bankAccountId !== data.bankAccountId
    ) {
      await updateBankAccountBalance(existingTransaction.bankAccountId);
    }
    
    // Atualizar o limite disponível do cartão de crédito
    if (data.creditCardId) {
      await updateCreditCardLimit(data.creditCardId);
    }
    
    // Se o cartão de crédito foi alterado, também atualizar o limite do cartão anterior
    if (
      existingTransaction.creditCardId && 
      existingTransaction.creditCardId !== data.creditCardId
    ) {
      await updateCreditCardLimit(existingTransaction.creditCardId);
    }
    
    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir transação
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Validar se a transação existe e pertence ao usuário
    const existingTransaction = await prisma.transaction.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }
    
    // Excluir a transação
    await prisma.transaction.delete({
      where: {
        id,
      },
    });
    
    // Atualizar o saldo da conta bancária
    if (existingTransaction.bankAccountId) {
      await updateBankAccountBalance(existingTransaction.bankAccountId);
    }
    
    // Atualizar o limite disponível do cartão de crédito
    if (existingTransaction.creditCardId) {
      await updateCreditCardLimit(existingTransaction.creditCardId);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir transação:', error);
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

// Função para atualizar o limite disponível do cartão de crédito
async function updateCreditCardLimit(cardId: string) {
  try {
    // Buscar todas as transações de despesa relacionadas ao cartão do mês atual
    const transactions = await prisma.transaction.findMany({
      where: {
        creditCardId: cardId,
        type: 'EXPENSE',
      },
    });
    
    // Obter o cartão de crédito
    const card = await prisma.creditCard.findUnique({
      where: {
        id: cardId,
      },
    });
    
    if (!card) return;
    
    // Calcular o total de despesas do cartão (valor positivo)
    const expensesSum = transactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );
    
    // Como não temos o campo availableLimit no modelo, podemos apenas
    // registrar um log da informação ou adicionar como metadado na resposta
    console.log(`Cartão ${card.name}: Limite total R$ ${card.limit.toFixed(2)}, Gastos: R$ ${expensesSum.toFixed(2)}, Disponível: R$ ${Math.max(0, card.limit - expensesSum).toFixed(2)}`);
    
    // Não atualizamos o cartão porque não há um campo para armazenar o limite disponível
  } catch (error) {
    console.error('Erro ao atualizar limite do cartão:', error);
  }
} 