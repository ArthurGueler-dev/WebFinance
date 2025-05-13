import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`API: Adicionando valor ao objetivo financeiro ${params.id}`);
  
  // Verificar autenticação
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    console.log('API: Usuário não autenticado');
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  
  const userId = session.user.id;
  if (!userId) {
    console.log('API: ID do usuário não encontrado na sessão');
    return NextResponse.json({ error: "ID do usuário não encontrado" }, { status: 401 });
  }
  
  try {
    const data = await req.json();
    
    // Validar dados
    if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
      console.log('API: Valor inválido');
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }
    
    // Verificar se o objetivo existe e pertence ao usuário
    const goal = await prisma.financialGoal.findUnique({
      where: {
        id: params.id,
        userId,
      }
    });
    
    if (!goal) {
      console.log('API: Objetivo financeiro não encontrado');
      return NextResponse.json({ error: "Objetivo financeiro não encontrado" }, { status: 404 });
    }
    
    // Calcular o novo valor
    const newAmount = goal.currentAmount + data.amount;
    const completed = newAmount >= goal.targetAmount;
    
    // Atualizar objetivo com o novo valor
    const updatedGoal = await prisma.financialGoal.update({
      where: {
        id: params.id,
      },
      data: {
        currentAmount: newAmount,
        completed: completed,
        updatedAt: new Date(),
      }
    });
    
    console.log(`API: Valor adicionado com sucesso. Novo total: ${newAmount}`);
    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('API: Erro ao adicionar valor ao objetivo:', error);
    return NextResponse.json(
      { error: "Erro ao adicionar valor ao objetivo" }, 
      { status: 500 }
    );
  }
} 