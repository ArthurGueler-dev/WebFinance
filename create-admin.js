const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  try {
    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: {
        email: 'admin@example.com',
      },
    });

    if (existingUser) {
      console.log('Usuário já existe, pulando criação.');
      return;
    }

    // Criar um novo usuário
    const hashedPassword = await bcrypt.hash('senha123', 10);
    
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        name: 'Administrador',
        email: 'admin@example.com',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('Usuário administrador criado com sucesso:', user);

    // Criar uma categoria padrão para teste
    const category = await prisma.category.create({
      data: {
        id: uuidv4(),
        name: 'Alimentação',
        color: '#FF5722',
        icon: 'BiRestaurant',
        type: 'EXPENSE',
        createdAt: new Date(),
      },
    });

    console.log('Categoria criada com sucesso:', category);

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 