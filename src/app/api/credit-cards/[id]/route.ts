import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface Params {
  params: {
    id: string;
  };
}

// GET - Obter um cartão de crédito específico
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
    
    const creditCard = await prisma.creditCard.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!creditCard) {
      return NextResponse.json(
        { error: 'Cartão de crédito não encontrado' },
        { status: 404 }
      );
    }
    
    // Buscar todas as transações deste mês para este cartão
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        creditCardId: id,
        date: {
          gte: firstDayOfMonth,
        },
        type: 'EXPENSE',
      },
    });
    
    // Calcular o valor usado
    const used = transactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    
    // Adicionar o availableLimit ao objeto do cartão
    const result = {
      ...creditCard,
      availableLimit: creditCard.limit - used,
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar cartão de crédito:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar cartão de crédito' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um cartão de crédito
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
    
    const { name, limit, dueDay, closingDay } = await request.json();
    
    if (!name || !limit || !dueDay || !closingDay) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Verificar se o cartão existe e pertence ao usuário
    const existingCard = await prisma.creditCard.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingCard) {
      return NextResponse.json(
        { error: 'Cartão de crédito não encontrado' },
        { status: 404 }
      );
    }
    
    const updatedCard = await prisma.creditCard.update({
      where: { id },
      data: {
        name,
        limit: parseFloat(limit),
        dueDay: parseInt(dueDay),
        closingDay: parseInt(closingDay),
      },
    });
    
    // Buscar transações para calcular limite disponível
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        creditCardId: id,
        date: {
          gte: firstDayOfMonth,
        },
        type: 'EXPENSE',
      },
    });
    
    const used = transactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    
    return NextResponse.json({
      ...updatedCard,
      availableLimit: updatedCard.limit - used,
    });
  } catch (error) {
    console.error('Erro ao atualizar cartão de crédito:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar cartão de crédito' },
      { status: 500 }
    );
  }
}

// DELETE - Remover um cartão de crédito
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
    
    // Verificar se o cartão existe e pertence ao usuário
    const existingCard = await prisma.creditCard.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingCard) {
      return NextResponse.json(
        { error: 'Cartão de crédito não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se existem transações associadas
    const transactionsCount = await prisma.transaction.count({
      where: {
        creditCardId: id,
      },
    });
    
    if (transactionsCount > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir um cartão com transações vinculadas.' },
        { status: 400 }
      );
    }
    
    await prisma.creditCard.delete({
      where: {
        id,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir cartão de crédito:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir cartão de crédito' },
      { status: 500 }
    );
  }
} 