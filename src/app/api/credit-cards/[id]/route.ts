import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { getCreditCards } from '@/lib/db-fix';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface Params {
  params: {
    id: string;
  };
}

// GET - Obter um cartão de crédito específico
export async function GET(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Buscar todos os cartões usando a função adaptada
    const creditCards = await getCreditCards(session.user.id);
    
    // Filtrar o cartão específico pelo ID
    const creditCard = creditCards.find(card => card.id === id);
    
    if (!creditCard) {
      return NextResponse.json(
        { error: 'Cartão não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se é um cartão de vale alimentação
    const isVoucherCard = creditCard.name.includes('[Vale Alimentação]');
    
    // Buscar transações de despesa do mês atual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        creditCardId: id,
        type: 'EXPENSE',
        date: {
          gte: firstDayOfMonth,
        },
      },
    });
    
    // Calcular o valor usado
    const used = transactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );
    
    // Adicionar o availableLimit ao objeto do cartão
    return NextResponse.json({
      ...creditCard,
      availableLimit: creditCard.limit - used,
      isVoucherCard
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do cartão:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um cartão de crédito
export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    const { name, limit, dueDay, closingDay } = await request.json();
    
    // Verificar se o cartão existe e pertence ao usuário
    const creditCard = await prisma.creditCard.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!creditCard) {
      return NextResponse.json(
        { error: 'Cartão não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se é um cartão de vale alimentação
    const isVoucherCard = name.includes('[Vale Alimentação]');
    
    // Atualizar o cartão
    const updatedCard = await prisma.creditCard.update({
      where: {
        id,
      },
      data: {
        name,
        limit: parseFloat(limit),
        dueDay: parseInt(dueDay),
        closingDay: parseInt(closingDay),
      },
    });
    
    // Buscar transações de despesa do mês atual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        creditCardId: id,
        type: 'EXPENSE',
        date: {
          gte: firstDayOfMonth,
        },
      },
    });
    
    // Calcular o valor usado
    const used = transactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );
    
    // Retornar o objeto atualizado com o limite disponível
    return NextResponse.json({
      ...updatedCard,
      availableLimit: updatedCard.limit - used,
      isVoucherCard
    });
  } catch (error) {
    console.error('Erro ao atualizar cartão:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
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