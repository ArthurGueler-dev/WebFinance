import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Armazenar quando foi feito o último reset para cada usuário e por mês
const lastResetByUser: Record<string, Record<string, boolean>> = {};

// GET - Resetar valor disponível dos cartões de Vale Alimentação
export async function GET(request: Request) {
  try {
    console.log("API: Iniciando reset dos cartões de Vale Alimentação");
    
    // Verificar se é uma chamada do agendador ou do middleware (com token especial)
    const schedulerToken = request.headers.get('x-scheduler-token');
    const isSchedulerRequest = schedulerToken === (process.env.SCHEDULER_SECRET || 'scheduler-token');
    
    let userId: string | undefined = undefined;
    
    // Data atual para controle de resets
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
    
    // Se não for uma chamada do agendador, verificar autenticação normal
    if (!isSchedulerRequest) {
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user?.id) {
        console.log("API: Usuário não autenticado");
        return NextResponse.json(
          { error: 'Não autorizado' },
          { status: 401 }
        );
      }
      
      userId = session.user.id;
      
      // Inicializar o controle para este usuário se não existir
      if (!lastResetByUser[userId]) {
        lastResetByUser[userId] = {};
      }
      
      // Verificar se já houve reset para este usuário neste mês
      // Ignorar verificação se for um reset forçado
      const isForceReset = request.headers.get('x-force-reset') === 'true';
      if (lastResetByUser[userId][currentMonth] && !isForceReset) {
        console.log(`API: Reset já realizado este mês para o usuário ${userId}`);
        return NextResponse.json({
          success: true,
          message: 'Reset já realizado este mês',
          wasSkipped: true
        });
      }
    }
    
    // Verificar se é o primeiro dia do mês para reset automático, 
    // ou se é uma chamada manual (botão de reset)
    const isFirstDayOfMonth = now.getDate() === 1;
    const isFirstDayReset = request.headers.get('x-first-day-reset') === 'true';
    const isManualReset = request.headers.get('x-manual-reset') === 'true';
    
    // Se não for primeiro dia do mês (ou indicado como tal) e não for reset manual, não fazer nada
    if (!isFirstDayOfMonth && !isFirstDayReset && !isManualReset && !isSchedulerRequest) {
      console.log("API: Não é primeiro dia do mês e não foi solicitado reset manual");
      return NextResponse.json({
        success: true,
        message: 'Reset não necessário (não é primeiro dia do mês)',
        wasSkipped: true
      });
    }
    
    // Buscar cartões de Vale Alimentação
    const foodVoucherCards = await prisma.creditCard.findMany({
      where: {
        ...(userId ? { userId } : {}), // Filtrar por usuário se houver ID
        cardType: 'FOOD_VOUCHER' as any // Force o tipo para compatibilidade
      }
    });
    
    console.log(`API: Encontrados ${foodVoucherCards.length} cartões VA para reset`);
    
    // Resets realizados
    const resets = [];
    
    // Para cada cartão VA, criar uma transação de reset
    for (const card of foodVoucherCards) {
      try {
        // Precisamos do userId para a transação - usar o do usuário atual ou do cartão
        const transactionUserId = userId || card.userId;
        
        if (!transactionUserId) {
          throw new Error('Não foi possível determinar o usuário para esta transação');
        }
        
        // 1. Buscar o total de despesas deste mês para este cartão
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        // Primeiro remover qualquer reset anterior para este cartão neste mês
        await prisma.transaction.deleteMany({
          where: {
            userId: transactionUserId,
            creditCardId: card.id,
            date: {
              gte: firstDayOfMonth,
              lte: lastDayOfMonth
            },
            description: {
              contains: "Reset"
            },
            type: "INCOME"
          }
        });
        
        // Depois buscar as despesas reais para realizar o reset
        const monthExpenses = await prisma.transaction.aggregate({
          where: {
            creditCardId: card.id,
            type: 'EXPENSE',
            date: {
              gte: firstDayOfMonth,
              lte: lastDayOfMonth
            }
          },
          _sum: {
            amount: true
          }
        });
        
        const spentAmount = Math.abs(monthExpenses._sum.amount || 0);
        
        // 2. Criar uma transação de crédito para "resetar" o limite
        if (spentAmount > 0) {
          // Buscar todas as categorias de receita do usuário e usar a primeira
          const categories = await prisma.category.findMany({
            where: {
              type: 'INCOME',
              user: {
                id: transactionUserId
              }
            },
            take: 1
          });
          
          if (!categories || categories.length === 0) {
            throw new Error('Nenhuma categoria de receita encontrada');
          }
          
          // Usar a primeira categoria encontrada
          const firstCategory = categories[0];
          
          // Criar a transação de reset
          const resetDescription = `[VALE ALIMENTAÇÃO] Reset ${isManualReset ? 'Manual' : 'Automático'} - ${card.name}`;
          
          const resetTransaction = await prisma.transaction.create({
            data: {
              description: resetDescription,
              amount: spentAmount, // Valor positivo para "estornar" as despesas
              date: new Date(), // Data atual
              type: 'INCOME',
              paymentMethod: 'FOOD_VOUCHER',
              recurrenceType: 'SINGLE',
              categoryId: firstCategory.id,
              creditCardId: card.id,
              userId: transactionUserId // Usar o userId já validado
            }
          });
          
          resets.push({
            cardId: card.id,
            cardName: card.name,
            resetAmount: spentAmount,
            transactionId: resetTransaction.id
          });
        } else {
          // Não houve despesas este mês para este cartão
          resets.push({
            cardId: card.id,
            cardName: card.name,
            resetAmount: 0,
            message: 'Não houve despesas este mês'
          });
        }
      } catch (cardError) {
        console.error(`Erro ao resetar cartão ${card.id}:`, cardError);
      }
    }
    
    // Registrar que o reset foi feito para este usuário este mês
    if (userId) {
      if (!lastResetByUser[userId]) {
        lastResetByUser[userId] = {};
      }
      lastResetByUser[userId][currentMonth] = true;
    }
    
    console.log(`API: Reset concluído. ${resets.length} cartões processados.`);
    
    return NextResponse.json({
      success: true,
      message: `${resets.length} cartões de VA processados`,
      resets
    });
  } catch (error) {
    console.error('Erro ao resetar cartões de VA:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
} 