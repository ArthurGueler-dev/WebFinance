import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { TransactionType } from '@prisma/client';

// Categorias padrão
const defaultCategories = [
  // Despesas Essenciais
  { name: 'Alimentação', color: '#FF5733', type: TransactionType.EXPENSE, icon: '🍔' },
  { name: 'Supermercado', color: '#FF8C33', type: TransactionType.EXPENSE, icon: '🛒' },
  { name: 'Restaurantes', color: '#FFBD33', type: TransactionType.EXPENSE, icon: '🍽️' },
  { name: 'Transporte', color: '#336BFF', type: TransactionType.EXPENSE, icon: '🚗' },
  { name: 'Combustível', color: '#3388FF', type: TransactionType.EXPENSE, icon: '⛽' },
  { name: 'Transporte Público', color: '#33A1FF', type: TransactionType.EXPENSE, icon: '🚌' },
  { name: 'Moradia', color: '#33FF57', type: TransactionType.EXPENSE, icon: '🏠' },
  { name: 'Aluguel', color: '#33FF81', type: TransactionType.EXPENSE, icon: '🔑' },
  { name: 'Condomínio', color: '#33FFAA', type: TransactionType.EXPENSE, icon: '🏢' },
  { name: 'Luz', color: '#FFD700', type: TransactionType.EXPENSE, icon: '💡' },
  { name: 'Água', color: '#33D6FF', type: TransactionType.EXPENSE, icon: '💧' },
  { name: 'Internet', color: '#FF7733', type: TransactionType.EXPENSE, icon: '📡' },
  { name: 'Telefone', color: '#FF5533', type: TransactionType.EXPENSE, icon: '📱' },
  
  // Despesas Saúde e Bem-estar
  { name: 'Saúde', color: '#FF3377', type: TransactionType.EXPENSE, icon: '💊' },
  { name: 'Médico', color: '#FF3366', type: TransactionType.EXPENSE, icon: '👨‍⚕️' },
  { name: 'Medicamentos', color: '#FF3355', type: TransactionType.EXPENSE, icon: '💉' },
  { name: 'Plano de Saúde', color: '#FF3344', type: TransactionType.EXPENSE, icon: '🏥' },
  { name: 'Academia', color: '#33FF44', type: TransactionType.EXPENSE, icon: '🏋️' },
  
  // Despesas Desenvolvimento
  { name: 'Educação', color: '#33FFF0', type: TransactionType.EXPENSE, icon: '📚' },
  { name: 'Cursos', color: '#33FFCC', type: TransactionType.EXPENSE, icon: '📝' },
  { name: 'Livros', color: '#33FFAA', type: TransactionType.EXPENSE, icon: '📖' },
  
  // Despesas Pessoais
  { name: 'Vestuário', color: '#FFD133', type: TransactionType.EXPENSE, icon: '👕' },
  { name: 'Cuidados Pessoais', color: '#FF99CC', type: TransactionType.EXPENSE, icon: '💅' },
  { name: 'Presentes', color: '#FF33FF', type: TransactionType.EXPENSE, icon: '🎁' },
  
  // Despesas Lazer e Entretenimento
  { name: 'Lazer', color: '#F033FF', type: TransactionType.EXPENSE, icon: '🎮' },
  { name: 'Viagem', color: '#CC33FF', type: TransactionType.EXPENSE, icon: '✈️' },
  { name: 'Cinema', color: '#AA33FF', type: TransactionType.EXPENSE, icon: '🎬' },
  { name: 'Streaming', color: '#9933FF', type: TransactionType.EXPENSE, icon: '📺' },
  { name: 'Bares', color: '#8833FF', type: TransactionType.EXPENSE, icon: '🍻' },
  
  // Despesas Financeiras
  { name: 'Financiamentos', color: '#885533', type: TransactionType.EXPENSE, icon: '🏦' },
  { name: 'Empréstimos', color: '#774422', type: TransactionType.EXPENSE, icon: '💰' },
  { name: 'Seguros', color: '#663311', type: TransactionType.EXPENSE, icon: '🔒' },
  { name: 'Impostos', color: '#552200', type: TransactionType.EXPENSE, icon: '📊' },
  { name: 'Taxas Bancárias', color: '#441100', type: TransactionType.EXPENSE, icon: '💳' },
  
  // Outros
  { name: 'Pets', color: '#88BB33', type: TransactionType.EXPENSE, icon: '🐶' },
  { name: 'Doações', color: '#77AA22', type: TransactionType.EXPENSE, icon: '🤝' },
  { name: 'Diversos', color: '#888888', type: TransactionType.EXPENSE, icon: '📦' },
  { name: 'Outros Gastos', color: '#777777', type: TransactionType.EXPENSE, icon: '💸' },
  
  // Receitas
  { name: 'Salário', color: '#33FF33', type: TransactionType.INCOME, icon: '💰' },
  { name: 'Bônus', color: '#66FF66', type: TransactionType.INCOME, icon: '💵' },
  { name: 'Freelance', color: '#33DDFF', type: TransactionType.INCOME, icon: '💻' },
  { name: 'Investimentos', color: '#FF9900', type: TransactionType.INCOME, icon: '📈' },
  { name: 'Dividendos', color: '#FFAA00', type: TransactionType.INCOME, icon: '💹' },
  { name: 'Juros', color: '#FFBB00', type: TransactionType.INCOME, icon: '💲' },
  { name: 'Aluguel', color: '#FFCC00', type: TransactionType.INCOME, icon: '🏘️' },
  { name: 'Vendas', color: '#FFDD00', type: TransactionType.INCOME, icon: '🏷️' },
  { name: 'Presentes', color: '#9933FF', type: TransactionType.INCOME, icon: '🎁' },
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
      orderBy: [
        {
          type: 'asc',
        },
        {
          name: 'asc',
        },
      ],
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

// POST - Criar nova categoria
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { name, color, type, icon } = body;
    
    if (!name || !color || !type) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }
    
    const newCategory = await prisma.category.create({
      data: {
        name,
        color,
        type,
        icon,
      },
    });
    
    return NextResponse.json(newCategory);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao criar categoria' },
      { status: 500 }
    );
  }
} 