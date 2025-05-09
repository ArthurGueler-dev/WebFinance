import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - Obter todos os cartões de crédito do usuário
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const creditCards = await prisma.creditCard.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    // Adicionar campo availableLimit para cada cartão
    // Isso é uma simulação, pois não temos esse campo no banco de dados
    // Em uma aplicação real, isso seria calculado com base nas transações
    const cardsWithAvailableLimit = await Promise.all(
      creditCards.map(async (card) => {
        // Buscar todas as transações deste mês para este cartão
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const transactions = await prisma.transaction.findMany({
          where: {
            creditCardId: card.id,
            date: {
              gte: firstDayOfMonth,
            },
            type: 'EXPENSE',
          },
        });
        
        // Calcular o valor usado
        const used = transactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
        
        // Adicionar o availableLimit ao objeto do cartão
        return {
          ...card,
          availableLimit: card.limit - used,
        };
      })
    );
    
    return NextResponse.json(cardsWithAvailableLimit);
  } catch (error) {
    console.error('Erro ao buscar cartões de crédito:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar cartões de crédito' },
      { status: 500 }
    );
  }
}

// POST - Criar um novo cartão de crédito
export async function POST(request: Request) {
  try {
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
    
    const creditCard = await prisma.creditCard.create({
      data: {
        name,
        limit: parseFloat(limit),
        dueDay: parseInt(dueDay),
        closingDay: parseInt(closingDay),
        userId: session.user.id,
      },
    });
    
    // Adicionar availableLimit ao objeto retornado
    return NextResponse.json({
      ...creditCard,
      availableLimit: parseFloat(limit),
    });
  } catch (error) {
    console.error('Erro ao criar cartão de crédito:', error);
    return NextResponse.json(
      { error: 'Erro ao criar cartão de crédito' },
      { status: 500 }
    );
  }
} 