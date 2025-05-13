import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getBudgets, createBudget } from '@/lib/db-fix';

export async function GET(req: NextRequest) {
  console.log('API: Buscando orçamentos');
  
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
    // Obter parâmetros de consulta
    const url = new URL(req.url);
    const month = parseInt(url.searchParams.get('month') || '', 10) || new Date().getMonth() + 1;
    const year = parseInt(url.searchParams.get('year') || '', 10) || new Date().getFullYear();
    
    console.log(`API: Buscando orçamentos para ${month}/${year}`);
    
    // Buscar orçamentos usando a função adaptada
    const budgets = await getBudgets(userId, month, year);
    
    console.log(`API: Encontrados ${budgets.length} orçamentos`);
    return NextResponse.json(budgets);
  } catch (error) {
    console.error('API: Erro ao buscar orçamentos:', error);
    return NextResponse.json(
      { error: "Erro ao buscar orçamentos" }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  console.log('API: Criando novo orçamento');
  
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
    
    // Validar dados obrigatórios
    if (!data.categoryId || !data.amount || !data.month || !data.year) {
      console.log('API: Dados incompletos');
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }
    
    // Criar novo orçamento usando a função adaptada
    try {
      const newBudget = await createBudget({
        categoryId: data.categoryId,
        amount: parseFloat(data.amount),
        month: data.month,
        year: data.year,
        alertThreshold: data.alertThreshold || 80,
        userId
      });
      
      console.log('API: Orçamento criado com sucesso');
      return NextResponse.json(newBudget);
    } catch (error) {
      if (error instanceof Error && error.message === 'DUPLICATE_BUDGET') {
        console.log('API: Orçamento já existe para esta categoria neste mês');
        return NextResponse.json(
          { error: "DUPLICATE_BUDGET", message: "Já existe um orçamento para esta categoria neste mês" }, 
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('API: Erro ao criar orçamento:', error);
    return NextResponse.json(
      { error: "Erro ao criar orçamento" }, 
      { status: 500 }
    );
  }
} 