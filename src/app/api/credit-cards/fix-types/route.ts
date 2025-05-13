import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - Corrigir tipos de cartões
export async function GET(request: Request) {
  try {
    console.log("API: Iniciando correção de tipos de cartões");
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      console.log("API: Usuário não autenticado");
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Buscar cartões do usuário
    const creditCards = await prisma.creditCard.findMany({
      where: {
        userId: session.user.id
      }
    });
    
    console.log(`API: Encontrados ${creditCards.length} cartões para correção`);
    
    // Correções realizadas
    const updates = [];
    
    // Para cada cartão, verificar e corrigir o tipo
    for (const card of creditCards) {
      try {
        // Verificar se é Vale Alimentação pelo nome ou pelo tipo atual
        const isVoucherCard = card.name.includes('[Vale Alimentação]');
        const isFoodVoucherType = card.cardType === 'FOOD_VOUCHER';
        
        // Determinar o tipo que deve ter
        let correctType;
        
        if (isVoucherCard || isFoodVoucherType) {
          // Se tem marcador no nome OU já está como FOOD_VOUCHER, manter como FOOD_VOUCHER
          correctType = 'FOOD_VOUCHER';
        } else {
          // Caso contrário, manter como CREDIT ou o tipo que já está
          correctType = card.cardType || 'CREDIT';
        }
        
        const currentType = card.cardType || 'CREDIT';
        
        console.log(`API: Cartão ${card.id} - "${card.name}" - Tipo atual: ${currentType}`);
        
        // FORÇAR atualização independentemente do tipo atual
        console.log(`API: Forçando cartão ${card.id} para tipo ${correctType}`);
        
        // Atualizar o tipo no banco de dados
        await prisma.creditCard.update({
          where: { id: card.id },
          data: { 
            cardType: correctType as any  // Forçar o tipo como CardType enum
          }
        });
        
        updates.push({
          id: card.id,
          name: card.name,
          oldType: currentType,
          newType: correctType
        });
      } catch (cardError) {
        console.error(`Erro ao atualizar cartão ${card.id}:`, cardError);
      }
    }
    
    console.log(`API: Correção concluída. ${updates.length} cartões atualizados.`);
    
    return NextResponse.json({
      success: true,
      message: `${updates.length} cartões corrigidos`,
      updates
    });
  } catch (error) {
    console.error('Erro ao corrigir tipos de cartões:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
} 