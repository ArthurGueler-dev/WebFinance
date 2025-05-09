import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - Obter todas as transações do usuário
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Pegar parâmetros de consulta para filtrar
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const description = url.searchParams.get('description');
    
    // Construir objeto de consulta
    const where: any = {
      userId: session.user.id,
    };
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (startDate) {
      where.date = {
        ...where.date,
        gte: new Date(startDate),
      };
    }
    
    if (endDate) {
      where.date = {
        ...where.date,
        lte: new Date(endDate),
      };
    }
    
    if (description) {
      where.description = {
        contains: description,
        mode: 'insensitive',
      };
    }
    
    // Buscar transações com categorias
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
        bankAccount: true,
        creditCard: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
    
    // Garantir que todas as despesas tenham valores positivos para consistência
    const formattedTransactions = transactions.map(transaction => ({
      ...transaction,
      amount: transaction.type === 'EXPENSE' ? Math.abs(transaction.amount) : transaction.amount,
    }));
    
    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar transações' },
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