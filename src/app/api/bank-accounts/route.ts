import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - Obter todas as contas bancárias do usuário
export async function GET() {
  try {
    console.log("API: Iniciando busca de contas bancárias");
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      console.log("API: Usuário não autenticado ao buscar contas bancárias");
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    console.log("API: Usuário autenticado, buscando contas bancárias");
    
    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    console.log(`API: Encontradas ${bankAccounts.length} contas bancárias`);
    
    return NextResponse.json(bankAccounts);
  } catch (error) {
    console.error('Erro ao buscar contas bancárias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar contas bancárias' },
      { status: 500 }
    );
  }
}

// POST - Criar uma nova conta bancária
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { name, initialBalance } = await request.json();
    
    if (!name || initialBalance === undefined) {
      return NextResponse.json(
        { error: 'Nome e saldo inicial são obrigatórios' },
        { status: 400 }
      );
    }
    
    const bankAccount = await prisma.bankAccount.create({
      data: {
        name,
        initialBalance: parseFloat(initialBalance),
        currentBalance: parseFloat(initialBalance),
        userId: session.user.id,
      },
    });
    
    return NextResponse.json(bankAccount);
  } catch (error) {
    console.error('Erro ao criar conta bancária:', error);
    return NextResponse.json(
      { error: 'Erro ao criar conta bancária' },
      { status: 500 }
    );
  }
} 