import { NextResponse } from 'next/server';
import { scheduleResetFoodVouchers } from '@/lib/scheduler';

// GET - Executar manualmente o reset dos cartões VA
export async function GET(request: Request) {
  try {
    console.log("API: Executando reset manual dos cartões VA");
    
    // Verificar token de autorização
    const schedulerToken = request.headers.get('x-scheduler-token');
    if (schedulerToken !== (process.env.SCHEDULER_SECRET || 'scheduler-token')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Executar reset diretamente
    const result = await scheduleResetFoodVouchers();
    
    return NextResponse.json({
      success: true,
      message: 'Reset manual executado com sucesso',
      result
    });
  } catch (error) {
    console.error('Erro ao executar reset manual:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
} 