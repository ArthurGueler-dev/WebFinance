import { prisma } from './prisma';

// Track reset status by month to avoid duplicate resets
const resetTracker = new Map<string, boolean>();

/**
 * Função que executa o reset automático dos cartões de Vale Alimentação
 * Esta função deve ser executada no primeiro dia de cada mês
 */
export async function scheduleResetFoodVouchers() {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
    
    // Verificar se já fizemos reset este mês
    const resetKey = `va_reset_${currentMonth}`;
    if (resetTracker.get(resetKey)) {
      console.log(`Scheduler: Reset já realizado para o mês ${currentMonth}`);
      return {
        success: true,
        message: `Reset já realizado para o mês ${currentMonth}`,
        wasSkipped: true
      };
    }
    
    console.log("Scheduler: Iniciando reset automático dos cartões VA");
    
    // Pegar todos os usuários com cartões VA
    const usersWithVA = await prisma.creditCard.findMany({
      where: {
        cardType: 'FOOD_VOUCHER'
      },
      select: {
        userId: true
      },
      distinct: ['userId']
    });
    
    console.log(`Scheduler: Encontrados ${usersWithVA.length} usuários com cartões VA`);
    
    // Para cada usuário, fazer o reset dos cartões
    for (const user of usersWithVA) {
      try {
        // Definir BASE_URL para a API
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        
        // Fazer a chamada fetch para a API de reset
        const response = await fetch(`${baseUrl}/api/credit-cards/reset-food-voucher`, {
          headers: {
            'Content-Type': 'application/json',
            // Token especial para jobs agendados
            'x-scheduler-token': process.env.SCHEDULER_SECRET || 'scheduler-token',
            // Indicar que é primeiro dia do mês
            'x-first-day-reset': 'true'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao resetar cartões do usuário ${user.userId}`);
        }
        
        const result = await response.json();
        console.log(`Scheduler: Reset para usuário ${user.userId} concluído`, result);
      } catch (userError) {
        console.error(`Scheduler: Erro ao processar usuário ${user.userId}:`, userError);
      }
    }
    
    // Marcar que fizemos o reset este mês
    resetTracker.set(resetKey, true);
    
    console.log("Scheduler: Reset automático dos cartões VA concluído");
    return {
      success: true,
      message: `Reset automático concluído para ${usersWithVA.length} usuários`
    };
  } catch (error) {
    console.error("Scheduler: Erro no reset automático:", error);
    return {
      success: false,
      message: 'Erro no reset automático',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Iniciar agendador - esta função deve ser chamada na inicialização do servidor
 */
export function initScheduler() {
  // Verificar se estamos em ambiente de navegador
  if (typeof window !== 'undefined') {
    console.log("Scheduler: Detectado ambiente de navegador, ignorando inicialização");
    return;
  }

  // Track executed resets to prevent duplicates
  let lastResetMonth = '';
  
  // Verificar a cada hora se estamos no primeiro dia do mês para fazer o reset
  setInterval(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
    
    // Se for o primeiro dia do mês e ainda não fizemos reset este mês
    if (now.getDate() === 1 && lastResetMonth !== currentMonth) {
      // Registrar o mês do reset
      lastResetMonth = currentMonth;
      
      scheduleResetFoodVouchers().catch(error => {
        console.error("Erro ao executar reset agendado:", error);
      });
    }
  }, 60 * 60 * 1000); // 1 hora
  
  console.log("Scheduler: Agendador iniciado com sucesso");
} 