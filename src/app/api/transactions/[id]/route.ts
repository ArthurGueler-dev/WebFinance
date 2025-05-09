import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface Params {
  params: {
    id: string;
  };
}

// GET - Obter uma transação específica
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Buscar transação com relações
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
    
    // Garantir valores positivos para despesas
    const formattedTransaction = {
      ...transaction,
      amount: transaction.type === 'EXPENSE' ? Math.abs(transaction.amount) : transaction.amount,
    };
    
    return NextResponse.json(formattedTransaction);
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar transação' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar uma transação
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar se a transação existe e pertence ao usuário
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
    
    const data = await request.json();
    const { 
      description, 
      amount, 
      date, 
      type, 
      paymentMethod, 
      categoryId, 
      bankAccountId, 
      creditCardId 
    } = data;
    
    // Validar campos obrigatórios
    if (!description || !amount || !date || !type || !paymentMethod || !categoryId) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não informados' },
        { status: 400 }
      );
    }
    
    // Verificar mudanças no valor da transação para atualizar saldos
    const amountChanged = existingTransaction.amount !== parseFloat(amount);
    const typeChanged = existingTransaction.type !== type;
    const bankAccountChanged = existingTransaction.bankAccountId !== bankAccountId;
    const paymentMethodChanged = existingTransaction.paymentMethod !== paymentMethod;
    
    // Se a transação estiver sendo alterada de forma que afeta saldos, ajustar os saldos
    
    // 1. Reverter o efeito da transação antiga se necessário
    if (
      amountChanged || 
      typeChanged || 
      bankAccountChanged || 
      paymentMethodChanged
    ) {
      // Reverter efeito da transação antiga na conta original
      if (existingTransaction.bankAccountId && 
         (existingTransaction.type === 'INCOME' || 
          (existingTransaction.type === 'EXPENSE' && existingTransaction.paymentMethod !== 'CREDIT'))
      ) {
        // Para INCOME: decrementar o saldo (remover a receita)
        // Para EXPENSE: incrementar o saldo (adicionar de volta o valor gasto)
        const updateAmount = existingTransaction.type === 'INCOME' 
          ? -existingTransaction.amount  // Valor negativo para decrementar a receita
          : existingTransaction.amount;  // Valor positivo para incrementar (reverter a despesa)
          
        await prisma.bankAccount.update({
          where: { id: existingTransaction.bankAccountId },
          data: {
            currentBalance: {
              increment: updateAmount, // Usamos increment com o valor correto (+/-)
            },
          },
        });
      }
      
      // 2. Aplicar o efeito da nova transação
      if (bankAccountId) {
        // Se for receita na nova transação, adicionar ao saldo
        if (type === 'INCOME') {
          await prisma.bankAccount.update({
            where: { id: bankAccountId },
            data: {
              currentBalance: {
                increment: Math.abs(parseFloat(amount)), // Garantir que o valor seja positivo
              },
            },
          });
        } 
        // Se for despesa e não for crédito, subtrair do saldo
        else if (type === 'EXPENSE' && paymentMethod !== 'CREDIT') {
          await prisma.bankAccount.update({
            where: { id: bankAccountId },
            data: {
              currentBalance: {
                decrement: Math.abs(parseFloat(amount)), // Garantir que o valor seja positivo
              },
            },
          });
        }
      }
    }
    
    // Atualizar a transação
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        description,
        amount: type === 'EXPENSE' ? Math.abs(parseFloat(amount)) : parseFloat(amount),
        date: new Date(date),
        type,
        paymentMethod,
        categoryId,
        bankAccountId: bankAccountId || null,
        creditCardId: creditCardId || null,
      },
      include: {
        category: true,
        bankAccount: true,
        creditCard: true,
      },
    });
    
    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar transação' },
      { status: 500 }
    );
  }
}

// DELETE - Remover uma transação
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar se a transação existe e pertence ao usuário
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
    
    // Reverter o efeito da transação nos saldos
    if (existingTransaction.bankAccountId) {
      // Se for receita, remover do saldo (decrementar)
      if (existingTransaction.type === 'INCOME') {
        await prisma.bankAccount.update({
          where: { id: existingTransaction.bankAccountId },
          data: {
            currentBalance: {
              decrement: Math.abs(existingTransaction.amount), // Garantir que o valor seja positivo
            },
          },
        });
      } 
      // Se for despesa e não for crédito, adicionar ao saldo (incrementar)
      else if (existingTransaction.type === 'EXPENSE' && existingTransaction.paymentMethod !== 'CREDIT') {
        await prisma.bankAccount.update({
          where: { id: existingTransaction.bankAccountId },
          data: {
            currentBalance: {
              increment: Math.abs(existingTransaction.amount), // Garantir que o valor seja positivo
            },
          },
        });
      }
    }
    
    // Excluir a transação
    await prisma.transaction.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir transação:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir transação' },
      { status: 500 }
    );
  }
} 