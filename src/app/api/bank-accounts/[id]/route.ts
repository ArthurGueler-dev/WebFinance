import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface Params {
  params: {
    id: string;
  };
}

// GET - Obter uma conta bancária específica
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
    
    const bankAccount = await prisma.bankAccount.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!bankAccount) {
      return NextResponse.json(
        { error: 'Conta bancária não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(bankAccount);
  } catch (error) {
    console.error('Erro ao buscar conta bancária:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar conta bancária' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar uma conta bancária
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
    
    const data = await request.json();
    const { name, initialBalance } = data;
    
    // Verificar se a conta existe e pertence ao usuário
    const existingAccount = await prisma.bankAccount.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Conta bancária não encontrada' },
        { status: 404 }
      );
    }
    
    // Calcular a diferença do saldo inicial para ajustar o saldo atual
    const initialBalanceDiff = parseFloat(initialBalance) - existingAccount.initialBalance;
    const newCurrentBalance = existingAccount.currentBalance + initialBalanceDiff;
    
    const updatedAccount = await prisma.bankAccount.update({
      where: {
        id,
      },
      data: {
        name,
        initialBalance: parseFloat(initialBalance),
        currentBalance: newCurrentBalance,
      },
    });
    
    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error('Erro ao atualizar conta bancária:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar conta bancária' },
      { status: 500 }
    );
  }
}

// DELETE - Remover uma conta bancária
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
    
    // Verificar se a conta existe e pertence ao usuário
    const existingAccount = await prisma.bankAccount.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Conta bancária não encontrada' },
        { status: 404 }
      );
    }
    
    // Remover a conta
    await prisma.bankAccount.delete({
      where: {
        id,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir conta bancária:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir conta bancária' },
      { status: 500 }
    );
  }
} 