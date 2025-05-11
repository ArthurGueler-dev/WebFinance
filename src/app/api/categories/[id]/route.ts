import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - Obter categoria por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    const category = await prisma.category.findUnique({
      where: { id },
    });
    
    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar categoria' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar categoria
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    const body = await request.json();
    const { name, color, icon } = body;
    
    if (!name || !color) {
      return NextResponse.json(
        { error: 'Nome e cor são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Verificar se a categoria existe
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }
    
    // Atualizar categoria
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        color,
        icon,
      },
    });
    
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar categoria' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir categoria
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Verificar se existem transações usando esta categoria
    const transactionsCount = await prisma.transaction.count({
      where: { categoryId: id },
    });
    
    if (transactionsCount > 0) {
      return NextResponse.json(
        { 
          error: 'Não é possível excluir esta categoria porque ela está sendo usada em transações',
          transactionsCount 
        },
        { status: 400 }
      );
    }
    
    // Excluir categoria
    await prisma.category.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir categoria' },
      { status: 500 }
    );
  }
} 