import { NextResponse } from 'next/server';
import { initScheduler } from '@/lib/scheduler';

// Variável para rastrear se o agendador já foi inicializado
let schedulerInitialized = false;

// GET - Inicializar o agendador (chamado durante o startup da aplicação)
export async function GET(request: Request) {
  try {
    // Evitar inicialização duplicada
    if (!schedulerInitialized) {
      console.log("API: Inicializando agendador...");
      initScheduler();
      schedulerInitialized = true;
      console.log("API: Agendador inicializado com sucesso!");
    } else {
      console.log("API: Agendador já estava inicializado.");
    }
    
    return NextResponse.json({
      success: true,
      message: 'Agendador inicializado com sucesso',
      alreadyInitialized: schedulerInitialized
    });
  } catch (error) {
    console.error('Erro ao inicializar agendador:', error);
    return NextResponse.json(
      { error: 'Erro ao inicializar agendador' },
      { status: 500 }
    );
  }
} 