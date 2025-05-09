import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { TransactionType } from '@prisma/client';

// Categorias padrão
const defaultCategories = [
  // Despesas
  { name: 'Alimentação', color: '#FF5733', type: TransactionType.EXPENSE, icon: '🍔' },
  { name: 'Transporte', color: '#336BFF', type: TransactionType.EXPENSE, icon: '🚗' },
  { name: 'Moradia', color: '#33FF57', type: TransactionType.EXPENSE, icon: '🏠' },
  { name: 'Lazer', color: '#F033FF', type: TransactionType.EXPENSE, icon: '🎮' },
  { name: 'Saúde', color: '#FF3377', type: TransactionType.EXPENSE, icon: '💊' },
  { name: 'Educação', color: '#33FFF0', type: TransactionType.EXPENSE, icon: '📚' },
  { name: 'Vestuário', color: '#FFD133', type: TransactionType.EXPENSE, icon: '👕' },
  { name: 'Contas', color: '#FF7733', type: TransactionType.EXPENSE, icon: '📱' },
  { name: 'Outros Gastos', color: '#888888', type: TransactionType.EXPENSE, icon: '💸' },
  
  // Receitas
  { name: 'Salário', color: '#33FF33', type: TransactionType.INCOME, icon: '💰' },
  { name: 'Freelance', color: '#33DDFF', type: TransactionType.INCOME, icon: '💻' },
  { name: 'Investimentos', color: '#FF9900', type: TransactionType.INCOME, icon: '📈' },
  { name: 'Presente', color: '#9933FF', type: TransactionType.INCOME, icon: '🎁' },
  { name: 'Reembolso', color: '#FFCC33', type: TransactionType.INCOME, icon: '🔄' },
  { name: 'Outras Receitas', color: '#66CC33', type: TransactionType.INCOME, icon: '💵' },
];

// GET - Obter todas as categorias
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar se existem categorias
    const categoriesCount = await prisma.category.count();
    
    // Se não existirem categorias, criar as padrão
    if (categoriesCount === 0) {
      await prisma.category.createMany({
        data: defaultCategories,
        skipDuplicates: true,
      });
    }
    
    // Buscar categorias
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    );
  }
}

// POST - Criar uma nova categoria
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { name, color, type, icon } = await request.json();
    
    // Validar campos obrigatórios
    if (!name || !color || !type) {
      return NextResponse.json(
        { error: 'Nome, cor e tipo são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Validar o tipo
    if (type !== TransactionType.INCOME && type !== TransactionType.EXPENSE) {
      return NextResponse.json(
        { error: 'O tipo deve ser INCOME ou EXPENSE' },
        { status: 400 }
      );
    }
    
    // Verificar se já existe uma categoria com o mesmo nome
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Já existe uma categoria com esse nome' },
        { status: 400 }
      );
    }
    
    // Criar a categoria
    const category = await prisma.category.create({
      data: {
        name,
        color,
        type,
        icon,
      },
    });
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao criar categoria' },
      { status: 500 }
    );
  }
} 