import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface Params {
  params: {
    id: string;
  };
}

// PUT - Atualizar o limite disponível de um cartão
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
    
    // Verificar se o cartão existe e pertence ao usuário
    const existingCard = await prisma.creditCard.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingCard) {
      return NextResponse.json(
        { error: 'Cartão de crédito não encontrado' },
        { status: 404 }
      );
    }
    
    const { availableLimit } = await request.json();
    
    if (availableLimit === undefined) {
      return NextResponse.json(
        { error: 'Limite disponível não informado' },
        { status: 400 }
      );
    }
    
    // Validar que o limite disponível não é maior que o limite total
    if (parseFloat(availableLimit) > existingCard.limit) {
      return NextResponse.json(
        { error: 'O limite disponível não pode ser maior que o limite total do cartão' },
        { status: 400 }
      );
    }
    
    // Na nossa implementação, não armazenamos diretamente o limite disponível
    // Armazenamos as transações de crédito e calculamos o limite disponível
    // Esta rota é para permitir ajustes manuais, por exemplo, quando o usuário
    // fez compras que não estão registradas no sistema
    
    // Calcular o valor usado atual (real)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        creditCardId: id,
        date: {
          gte: firstDayOfMonth,
        },
        type: 'EXPENSE',
      },
    });
    
    const usedAmount = transactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    const calculatedAvailableLimit = existingCard.limit - Math.abs(usedAmount);
    
    // Diferença entre o limite disponível calculado e o informado pelo usuário
    const diff = calculatedAvailableLimit - parseFloat(availableLimit);
    
    if (Math.abs(diff) > 0.01) { // Se há uma diferença significativa
      // Vamos criar uma transação de ajuste
      await prisma.transaction.create({
        data: {
          description: 'Ajuste manual de limite',
          amount: Math.abs(diff), // Usamos valor absoluto para garantir que seja positivo
          date: new Date(),
          type: 'EXPENSE',
          paymentMethod: 'CREDIT',
          recurrenceType: 'SINGLE',
          categoryId: await getAdjustmentCategoryId(),
          creditCardId: id,
          userId: session.user.id,
        },
      });
    }
    
    // Retornar o cartão com o limite disponível atualizado
    return NextResponse.json({
      ...existingCard,
      availableLimit: parseFloat(availableLimit),
    });
  } catch (error) {
    console.error('Erro ao atualizar limite disponível do cartão:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar limite disponível do cartão' },
      { status: 500 }
    );
  }
}

// Função para obter ou criar uma categoria para ajustes
async function getAdjustmentCategoryId(): Promise<string> {
  // Verificar se a categoria já existe
  let category = await prisma.category.findFirst({
    where: {
      name: 'Ajuste de Limite',
    },
  });
  
  // Se não existir, criar
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Ajuste de Limite',
        color: '#888888',
        type: 'EXPENSE',
      },
    });
  }
  
  return category.id;
} 