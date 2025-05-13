import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('API: Atualizando configurações de cartão:', params.id);
  
  // Verificar sessão do usuário
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    console.log('API: Usuário não autenticado');
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  
  // Obter o ID do usuário da sessão
  const userId = session.user.id;
  if (!userId) {
    console.log('API: ID do usuário não encontrado na sessão');
    return NextResponse.json({ error: "ID do usuário não encontrado" }, { status: 401 });
  }
  
  try {
    // Verificar se o cartão existe e pertence ao usuário
    const creditCard = await prisma.creditCard.findUnique({
      where: {
        id: params.id,
        userId: userId,
      }
    });
    
    if (!creditCard) {
      console.log('API: Cartão não encontrado ou não pertence ao usuário');
      return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 });
    }
    
    // Obter as configurações do corpo da requisição
    const settings = await req.json();
    console.log('API: Novas configurações recebidas:', settings);
    
    // Para esta implementação alternativa, retornamos sucesso simulado
    // A persistência real será feita via localStorage no cliente
    console.log('API: Configurações processadas com sucesso (simulação)');
    
    // Preparar a resposta
    const response = {
      id: creditCard.id,
      name: creditCard.name,
      color: settings.color
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('API: Erro ao atualizar configurações do cartão:', error);
    return NextResponse.json(
      { error: "Erro ao atualizar configurações do cartão" }, 
      { status: 500 }
    );
  }
} 