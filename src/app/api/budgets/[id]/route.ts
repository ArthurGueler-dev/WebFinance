import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getBudgetById, updateBudget, deleteBudget } from '@/lib/db-fix';

interface Params {
  params: {
    id: string;
  };
}

// GET - Obter um orçamento específico
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
    
    // Buscar o orçamento usando a função adaptada
    const budget = await getBudgetById(id, session.user.id);
    
    if (!budget) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(budget);
  } catch (error) {
    console.error('Erro ao buscar detalhes do orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um orçamento
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
    
    try {
      // Atualizar o orçamento usando a função adaptada
      const updatedBudget = await updateBudget(id, session.user.id, {
        amount: data.amount ? parseFloat(data.amount) : undefined,
        alertThreshold: data.alertThreshold ? parseFloat(data.alertThreshold) : undefined
      });
      
      return NextResponse.json(updatedBudget);
    } catch (error) {
      if (error instanceof Error && error.message === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Orçamento não encontrado' },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir um orçamento
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
    
    try {
      // Excluir o orçamento usando a função adaptada
      await deleteBudget(id, session.user.id);
      
      return NextResponse.json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Orçamento não encontrado' },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
} 