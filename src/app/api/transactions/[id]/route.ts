import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
// Importar as funções do db-fix
import { getTransactions } from '@/lib/db-fix';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { RecurrenceType, TransactionType } from '@prisma/client';

// GET - Obter transação específica
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
    
    // Buscar todas as transações do usuário
    const transactions = await getTransactions(session.user.id);
    
    // Filtrar a transação específica pelo ID
    const transaction = transactions.find(t => t.id === id);
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }
    
    // Converter para JSON para poder modificar livremente
    const transactionJson = JSON.parse(JSON.stringify(transaction));
    
    // Verificar se é um vale alimentação
    if (transactionJson.creditCardId && transactionJson.paymentMethod === 'DEBIT') {
      // Buscar o cartão para verificar se é um vale alimentação
      const card = await prisma.creditCard.findUnique({
        where: {
          id: transactionJson.creditCardId
        }
      });
      
      if (card && card.name.includes('[Vale Alimentação]')) {
        transactionJson.paymentMethod = 'FOOD_VOUCHER';
      }
    }
    
    return NextResponse.json(transactionJson);
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
      include: {
        creditCard: true
      }
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
    
    // Salvar o paymentMethod original antes de converter
    const originalPaymentMethod = data.paymentMethod;
    
    // Converter FOOD_VOUCHER para um valor de enum aceito (DEBIT como alternativa)
    let paymentMethod = data.paymentMethod;
    if (paymentMethod === 'FOOD_VOUCHER') {
      paymentMethod = 'DEBIT';
      console.log("Convertendo FOOD_VOUCHER para DEBIT temporariamente");
    }
    
    // Verificar se o cartão é de Vale Alimentação
    let isCardFoodVoucher = false;
    if (data.creditCardId) {
      const card = await prisma.creditCard.findUnique({
        where: { id: data.creditCardId }
      });
      
      if (card && card.name.includes('[Vale Alimentação]')) {
        isCardFoodVoucher = true;
      }
    }
    
    // Verificar se é uma transação de vale alimentação que não estava configurada como FOOD_VOUCHER
    if (isCardFoodVoucher && paymentMethod !== 'DEBIT') {
      paymentMethod = 'DEBIT'; // Forçar DEBIT para cartões de vale alimentação
    }
    
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
        paymentMethod: paymentMethod,
        categoryId: data.categoryId,
        bankAccountId: data.bankAccountId,
        creditCardId: data.creditCardId,
        recurrenceType: data.recurrenceType as RecurrenceType,
        installments: data.installments,
        currentInstallment: data.currentInstallment,
      },
      include: {
        category: true,
        bankAccount: true,
        creditCard: true,
      },
    });
    
    // Adicionar o valor FOOD_VOUCHER de volta na resposta
    const responseTransaction = {
      ...updatedTransaction,
      paymentMethod: originalPaymentMethod
    };
    
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
    
    return NextResponse.json(responseTransaction);
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
    include: {
      creditCard: true
    }
  });
  
  // Obter a conta bancária
  const account = await prisma.bankAccount.findUnique({
    where: {
      id: accountId,
    },
  });
  
  if (!account) return;

  // Calcular o novo saldo atual (saldo inicial + soma das transações, excluindo vale alimentação)
  const transactionsSum = transactions.reduce((sum, t) => {
    // Verificar se é uma transação de vale alimentação
    const isFoodVoucher = 
      t.creditCard && 
      t.creditCard.name.includes('[Vale Alimentação]');
    
    // Se for vale alimentação, não considerar no saldo
    if (isFoodVoucher) {
      return sum;
    }
    
    return sum + t.amount;
  }, 0);
  
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
    // Buscar o cartão para verificar seu tipo
    const card = await prisma.creditCard.findUnique({
      where: {
        id: cardId,
      },
    });
    
    if (!card) return;

    // Verificar se é um cartão de vale alimentação
    const isVoucherCard = card.name.includes('[Vale Alimentação]');
    
    // Buscar todas as transações de despesa relacionadas ao cartão
    const transactions = await prisma.transaction.findMany({
      where: {
        creditCardId: cardId,
        type: 'EXPENSE',
      },
    });
    
    // Calcular o total de despesas do cartão (valor positivo)
    const expensesSum = transactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );
    
    // Calcular limite disponível
    const availableLimit = Math.max(0, card.limit - expensesSum);
    
    // Registrar o limite disponível para o tipo correto de cartão
    if (isVoucherCard) {
      console.log(`Vale Alimentação ${card.name}: Limite total R$ ${card.limit.toFixed(2)}, Gastos: R$ ${expensesSum.toFixed(2)}, Disponível: R$ ${availableLimit.toFixed(2)}`);
    } else {
      console.log(`Cartão ${card.name}: Limite total R$ ${card.limit.toFixed(2)}, Gastos: R$ ${expensesSum.toFixed(2)}, Disponível: R$ ${availableLimit.toFixed(2)}`);
    }
    
    // Não atualizamos o cartão porque não há um campo para armazenar o limite disponível
  } catch (error) {
    console.error('Erro ao atualizar limite do cartão:', error);
  }
} 