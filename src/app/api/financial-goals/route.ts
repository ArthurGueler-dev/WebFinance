import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - Listar objetivos financeiros
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar objetivos financeiros do usuário
    const financialGoals = await prisma.financialGoal.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        targetDate: 'asc'
      }
    });
    
    return NextResponse.json(financialGoals);
  } catch (error) {
    console.error('Erro ao listar objetivos financeiros:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
}

// POST - Criar objetivo financeiro
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Obter dados do corpo da requisição
    const { name, targetAmount, targetDate, description, color, icon } = await request.json();
    
    // Validar dados obrigatórios
    if (!name || !targetAmount || !targetDate) {
      return NextResponse.json(
        { error: 'Dados incompletos: nome, valor alvo e data limite são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Criar objetivo financeiro
    const financialGoal = await prisma.financialGoal.create({
      data: {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: 0,
        targetDate: new Date(targetDate),
        description,
        color,
        icon,
        userId: session.user.id
      }
    });
    
    return NextResponse.json(financialGoal);
  } catch (error) {
    console.error('Erro ao criar objetivo financeiro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
} 