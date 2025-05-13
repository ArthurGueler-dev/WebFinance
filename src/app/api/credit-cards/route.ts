import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
// Importar a função do db-fix
import { getCreditCards } from '@/lib/db-fix';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - Listar cartões de crédito
export async function GET(request: Request) {
  try {
    console.log("API: Iniciando busca de cartões de crédito");
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      console.log("API: Usuário não autenticado ao buscar cartões");
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    console.log("API: Usuário autenticado, buscando cartões");
    
    // Buscar cartões do usuário usando a função adaptada
    const creditCards = await getCreditCards(session.user.id);
    
    console.log(`API: Encontrados ${creditCards.length} cartões`);
    
    // Buscar transações de despesa do mês atual para todos os cartões
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Extrair os IDs dos cartões
    const cardIds = creditCards.map(card => card.id);
    
    // Buscar transações relevantes para cálculo de limites
    console.log("API: Buscando transações para cálculo de limites");
    const transactions = await prisma.transaction.findMany({
      where: {
        creditCardId: {
          in: cardIds
        },
        type: 'EXPENSE',
        date: {
          gte: firstDayOfMonth
        }
      },
      select: {
        id: true,
        creditCardId: true,
        amount: true
      }
    });
    
    console.log(`API: Recuperadas ${transactions.length} transações para cálculo de limites`);
    
    // Calcular limite disponível para cada cartão
    const cardsWithLimits = creditCards.map(card => {
      // Filtrar transações do cartão atual
      const cardTransactions = transactions.filter(t => t.creditCardId === card.id);
      
      // Calcular o valor total usado
      const used = cardTransactions.reduce((sum: number, t: { amount: number }) => 
        sum + Math.abs(t.amount), 0);
      
      // Verificar se é Vale Alimentação - por nome OU pelo tipo no banco
      const isVoucherCard = card.name.includes('[Vale Alimentação]') || card.cardType === 'FOOD_VOUCHER';
      
      // Definir o tipo correto do cartão
      // Garantir que cartões de Vale Alimentação SEMPRE tenham tipo FOOD_VOUCHER
      const cardType = isVoucherCard ? 'FOOD_VOUCHER' : (card.cardType || 'CREDIT');
      
      // Retornar o cartão com limite disponível e flags adicionais
      return {
        ...card,
        cardType, // cardType forçado
        availableLimit: card.limit - used,
        isVoucherCard
      };
    });
    
    // Separar explicitamente os cartões para debug
    const debugVoucherCards = cardsWithLimits.filter(card => 
      card.cardType === 'FOOD_VOUCHER' || card.isVoucherCard
    );
    const debugRegularCards = cardsWithLimits.filter(card => 
      card.cardType !== 'FOOD_VOUCHER' && !card.isVoucherCard
    );
    
    console.log(`API: Separados ${debugVoucherCards.length} cartões VA e ${debugRegularCards.length} cartões regulares`);
    console.log("API: Retornando cartões com limites calculados");
    
    return NextResponse.json(cardsWithLimits);
  } catch (error) {
    console.error('Erro ao listar cartões:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
}

// POST - Criar cartão de crédito
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
    const { name, limit, dueDay, closingDay, cardType = 'CREDIT' } = await request.json();
    
    // Validar dados obrigatórios
    if (!name || !limit || !dueDay || !closingDay) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }
    
    // Verificar se é um vale alimentação pelo nome ou pelo tipo selecionado
    const isVoucherCard = name.includes('[Vale Alimentação]') || cardType === 'FOOD_VOUCHER';
    
    // Determinar o tipo correto a ser salvo
    const finalCardType = isVoucherCard ? 'FOOD_VOUCHER' : cardType;
    
    // Criar cartão
    const creditCard = await prisma.creditCard.create({
      data: {
        name,
        limit: parseFloat(limit),
        dueDay: parseInt(dueDay),
        closingDay: parseInt(closingDay),
        cardType: finalCardType as any, // Salvar o tipo correto
        userId: session.user.id
      }
    });
    
    // Adicionar availableLimit e isVoucherCard ao objeto retornado
    const response = {
      ...creditCard,
      availableLimit: parseFloat(limit),
      isVoucherCard
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao criar cartão de crédito:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
} 