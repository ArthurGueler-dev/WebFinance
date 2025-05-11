import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - Lista de transações
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Obter parâmetros de consulta 
    const { searchParams } = new URL(request.url);
    const creditCardId = searchParams.get('creditCardId');
    const type = searchParams.get('type');
    const bankAccountId = searchParams.get('bankAccountId');
    const paymentMethod = searchParams.get('paymentMethod');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Construir filtros
    const filters: any = {
      userId: session.user.id,
    };
    
    // Adicionar filtros opcionais se fornecidos
    if (creditCardId) filters.creditCardId = creditCardId;
    if (type) filters.type = type;
    if (bankAccountId) filters.bankAccountId = bankAccountId;
    if (paymentMethod) filters.paymentMethod = paymentMethod;
    
    // Filtros de data
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.gte = new Date(startDate);
      if (endDate) filters.date.lte = new Date(endDate);
    }
    
    // Buscar transações com filtros
    const transactions = await prisma.transaction.findMany({
      where: filters,
      include: {
        category: true,
        bankAccount: true,
        creditCard: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
    
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
}

// POST - Criar uma nova transação
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    const { 
      description, 
      amount, 
      date, 
      type, 
      paymentMethod, 
      categoryId, 
      bankAccountId, 
      creditCardId,
      recurrenceType,
      installments
    } = data;
    
    // Validar campos obrigatórios
    if (!description || amount === undefined || !date || !type || !paymentMethod || !categoryId) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não informados' },
        { status: 400 }
      );
    }
    
    // Verificar se a conta ou cartão de crédito existe
    if (paymentMethod === 'CREDIT' && !creditCardId) {
      return NextResponse.json(
        { error: 'Cartão de crédito é obrigatório para pagamentos com cartão de crédito' },
        { status: 400 }
      );
    }
    
    // Criar a transação
    const transaction = await prisma.transaction.create({
      data: {
        description,
        amount: type === 'EXPENSE' ? Math.abs(parseFloat(amount)) : parseFloat(amount),
        date: new Date(date),
        type,
        paymentMethod,
        recurrenceType: recurrenceType || 'SINGLE',
        installments: installments || null,
        currentInstallment: installments ? 1 : null,
        categoryId,
        bankAccountId: bankAccountId || null,
        creditCardId: creditCardId || null,
        userId: session.user.id,
      },
      include: {
        category: true,
        bankAccount: true,
        creditCard: true,
      },
    });
    
    // Se for despesa e pagamento não for cartão de crédito, atualizar saldo da conta
    if (type === 'EXPENSE' && paymentMethod !== 'CREDIT' && bankAccountId) {
      await prisma.bankAccount.update({
        where: { id: bankAccountId },
        data: {
          currentBalance: {
            decrement: Math.abs(parseFloat(amount)),
          },
        },
      });
    }
    
    // Se for receita, atualizar saldo da conta
    if (type === 'INCOME' && bankAccountId) {
      await prisma.bankAccount.update({
        where: { id: bankAccountId },
        data: {
          currentBalance: {
            increment: Math.abs(parseFloat(amount)),
          },
        },
      });
    }
    
    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return NextResponse.json(
      { error: 'Erro ao criar transação' },
      { status: 500 }
    );
  }
} 