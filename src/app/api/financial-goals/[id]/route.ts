import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// GET - Obter um objetivo financeiro específico
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
    
    // Buscar o objetivo financeiro
    const financialGoal = await prisma.financialGoal.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!financialGoal) {
      return NextResponse.json(
        { error: 'Objetivo financeiro não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(financialGoal);
  } catch (error) {
    console.error('Erro ao buscar detalhes do objetivo financeiro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um objetivo financeiro
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
    const data = await request.json();
    
    // Verificar se o objetivo existe e pertence ao usuário
    const financialGoal = await prisma.financialGoal.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!financialGoal) {
      return NextResponse.json(
        { error: 'Objetivo financeiro não encontrado' },
        { status: 404 }
      );
    }
    
    // Atualizar o objetivo
    const updatedGoal = await prisma.financialGoal.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        targetAmount: parseFloat(data.targetAmount),
        currentAmount: parseFloat(data.currentAmount),
        targetDate: new Date(data.targetDate),
        description: data.description,
        color: data.color,
        icon: data.icon,
        completed: data.completed || false,
      },
    });
    
    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Erro ao atualizar objetivo financeiro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar valor atual do objetivo
export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    const { amount, operation } = await request.json();
    
    if (!amount || !operation || !['add', 'subtract', 'set'].includes(operation)) {
      return NextResponse.json(
        { error: 'Dados inválidos. Forneça um valor e uma operação válida (add, subtract, set)' },
        { status: 400 }
      );
    }
    
    // Verificar se o objetivo existe e pertence ao usuário
    const financialGoal = await prisma.financialGoal.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!financialGoal) {
      return NextResponse.json(
        { error: 'Objetivo financeiro não encontrado' },
        { status: 404 }
      );
    }
    
    // Calcular o novo valor atual com base na operação
    let newCurrentAmount = financialGoal.currentAmount;
    const numericAmount = parseFloat(amount);
    
    if (operation === 'add') {
      newCurrentAmount += numericAmount;
    } else if (operation === 'subtract') {
      newCurrentAmount = Math.max(0, newCurrentAmount - numericAmount);
    } else if (operation === 'set') {
      newCurrentAmount = numericAmount;
    }
    
    // Verificar se o objetivo foi atingido
    const completed = newCurrentAmount >= financialGoal.targetAmount;
    
    // Atualizar o objetivo
    const updatedGoal = await prisma.financialGoal.update({
      where: {
        id,
      },
      data: {
        currentAmount: newCurrentAmount,
        completed,
      },
    });
    
    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Erro ao atualizar valor do objetivo:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir um objetivo financeiro
export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Verificar se o objetivo existe e pertence ao usuário
    const financialGoal = await prisma.financialGoal.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!financialGoal) {
      return NextResponse.json(
        { error: 'Objetivo financeiro não encontrado' },
        { status: 404 }
      );
    }
    
    // Excluir o objetivo
    await prisma.financialGoal.delete({
      where: {
        id,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir objetivo financeiro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
} 