const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  try {
    // Verificar se já existe um usuário
    const existingUser = await prisma.user.findFirst();
    let userId = existingUser?.id;

    // Se não existir usuário, criar um
    if (!userId) {
      const hashedPassword = await bcrypt.hash('senha123', 10);
      
      const newUser = await prisma.user.create({
        data: {
          id: uuidv4(),
          name: 'Usuário Demo',
          email: 'demo@exemplo.com',
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      
      userId = newUser.id;
      console.log('Usuário criado:', newUser.email);
    } else {
      console.log('Usando usuário existente:', existingUser.email);
    }

    // Criar categorias
    const categorias = [
      { nome: 'Alimentação', cor: '#FF5722', icone: 'UtensilsCrossed', tipo: 'EXPENSE' },
      { nome: 'Restaurantes', cor: '#FFC107', icone: 'UtensilsCrossed', tipo: 'EXPENSE' },
      { nome: 'Mercado', cor: '#4CAF50', icone: 'ShoppingCart', tipo: 'EXPENSE' },
      { nome: 'Transporte', cor: '#2196F3', icone: 'Car', tipo: 'EXPENSE' },
      { nome: 'Salário', cor: '#9C27B0', icone: 'Wallet', tipo: 'INCOME' },
      { nome: 'Freelance', cor: '#3F51B5', icone: 'Code', tipo: 'INCOME' },
    ];

    for (const categoria of categorias) {
      const existingCategory = await prisma.category.findFirst({
        where: { name: categoria.nome }
      });

      if (!existingCategory) {
        await prisma.category.create({
          data: {
            id: uuidv4(),
            name: categoria.nome,
            color: categoria.cor,
            icon: categoria.icone,
            type: categoria.tipo,
            createdAt: new Date(),
          },
        });
        console.log(`Categoria '${categoria.nome}' criada`);
      } else {
        console.log(`Categoria '${categoria.nome}' já existe`);
      }
    }

    // Buscar IDs das categorias criadas
    const categoriesList = await prisma.category.findMany();
    const alimentacaoId = categoriesList.find(c => c.name === 'Alimentação')?.id;
    const restaurantesId = categoriesList.find(c => c.name === 'Restaurantes')?.id;
    const mercadoId = categoriesList.find(c => c.name === 'Mercado')?.id;
    const salarioId = categoriesList.find(c => c.name === 'Salário')?.id;

    // Criar conta bancária
    let contaId;
    const existingAccount = await prisma.bankAccount.findFirst({
      where: { userId }
    });

    if (!existingAccount) {
      const novaConta = await prisma.bankAccount.create({
        data: {
          id: uuidv4(),
          name: 'Conta Principal',
          initialBalance: 5000,
          currentBalance: 5000,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      contaId = novaConta.id;
      console.log('Conta bancária criada');
    } else {
      contaId = existingAccount.id;
      console.log('Usando conta bancária existente');
    }

    // Criar cartões
    let creditCardId;
    let foodVoucherCardId;

    const existingCreditCard = await prisma.creditCard.findFirst({
      where: { 
        userId,
        cardType: 'CREDIT'
      }
    });

    if (!existingCreditCard) {
      const novoCartao = await prisma.creditCard.create({
        data: {
          id: uuidv4(),
          name: 'Cartão de Crédito',
          limit: 5000,
          dueDay: 10,
          closingDay: 5,
          cardType: 'CREDIT',
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      creditCardId = novoCartao.id;
      console.log('Cartão de crédito criado');
    } else {
      creditCardId = existingCreditCard.id;
      console.log('Usando cartão de crédito existente');
    }

    const existingFoodCard = await prisma.creditCard.findFirst({
      where: { 
        userId,
        name: { contains: '[Vale Alimentação]' }
      }
    });

    if (!existingFoodCard) {
      const novoCartaoAlimentacao = await prisma.creditCard.create({
        data: {
          id: uuidv4(),
          name: 'Alelo [Vale Alimentação]',
          limit: 700,
          dueDay: 1,
          closingDay: 1,
          cardType: 'FOOD_VOUCHER',
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      foodVoucherCardId = novoCartaoAlimentacao.id;
      console.log('Cartão vale alimentação criado');
    } else {
      foodVoucherCardId = existingFoodCard.id;
      console.log('Usando cartão vale alimentação existente');
    }

    // Criar transações para vale alimentação
    if (alimentacaoId && foodVoucherCardId) {
      const dataAtual = new Date();
      const mesAtual = dataAtual.getMonth();
      const anoAtual = dataAtual.getFullYear();
      
      // Criar algumas transações para o mês atual
      const transacoesVA = [
        { descricao: 'Mercado Dia', valor: 120, dia: 5, categoria: mercadoId },
        { descricao: 'Restaurante Bom Prato', valor: 35, dia: 8, categoria: restaurantesId },
        { descricao: 'Padaria Pão Quente', valor: 25, dia: 12, categoria: alimentacaoId },
        { descricao: 'Supermercado Extra', valor: 180, dia: 15, categoria: mercadoId },
        { descricao: 'Açaí do Zé', valor: 30, dia: 18, categoria: alimentacaoId },
        { descricao: 'Hamburguer Delivery', valor: 45, dia: 20, categoria: restaurantesId },
      ];

      for (const transacao of transacoesVA) {
        const data = new Date(anoAtual, mesAtual, transacao.dia);
        
        // Verificar se já existe uma transação similar para evitar duplicatas
        const existingTransaction = await prisma.transaction.findFirst({
          where: {
            description: transacao.descricao,
            date: {
              gte: new Date(data.getFullYear(), data.getMonth(), data.getDate()),
              lt: new Date(data.getFullYear(), data.getMonth(), data.getDate() + 1),
            },
            userId,
            creditCardId: foodVoucherCardId
          }
        });

        if (!existingTransaction) {
          await prisma.transaction.create({
            data: {
              id: uuidv4(),
              description: transacao.descricao,
              amount: -Math.abs(transacao.valor),
              date: data,
              type: 'EXPENSE',
              paymentMethod: 'DEBIT', // Usar DEBIT para compatibilidade
              recurrenceType: 'SINGLE',
              categoryId: transacao.categoria,
              userId,
              creditCardId: foodVoucherCardId,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          console.log(`Transação '${transacao.descricao}' criada com vale alimentação`);
        } else {
          console.log(`Transação '${transacao.descricao}' já existe`);
        }
      }
    }

    console.log('Dados de demonstração criados com sucesso!');
  } catch (error) {
    console.error('Erro ao criar dados de demonstração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 