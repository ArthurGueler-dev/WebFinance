'use client';

import { useEffect, useState } from 'react';

// Componente para inicializar o agendador apenas uma vez no cliente
export default function InitScheduler() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Verificar se já executou para evitar inicializações duplicadas
    if (!initialized) {
      console.log('Inicializando agendador diretamente no componente...');
      
      try {
        // Fazer uma chamada para o endpoint de execução manual
        fetch('/api/schedule-task', {
          method: 'GET', // Especificar método explicitamente
          headers: {
            'Content-Type': 'application/json',
            'x-scheduler-token': 'scheduler-token'
          }
        }).then(response => {
          if (response.ok) {
            console.log('Reset de VA executado com sucesso!');
          } else {
            console.error('Falha ao executar reset de VA');
          }
        }).catch(error => {
          console.error('Erro ao executar reset de VA:', error);
        });
        
        setInitialized(true);
      } catch (error) {
        console.error('Erro ao inicializar agendador:', error);
      }
    }
  }, [initialized]);

  // Componente não renderiza nada visualmente
  return null;
} 