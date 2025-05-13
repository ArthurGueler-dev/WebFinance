'use client';

import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';

export default function ResetNotification() {
  const [hasShownNotification, setHasShownNotification] = useState(false);

  useEffect(() => {
    // Verificar se já mostrou a notificação hoje
    const today = new Date().toISOString().split('T')[0];
    const notificationShown = localStorage.getItem(`va_reset_notification_${today}`);
    
    // Se estamos no primeiro dia do mês e ainda não mostrou a notificação
    if (new Date().getDate() === 1 && !notificationShown && !hasShownNotification) {
      // Mostrar a notificação apenas para usuários com cartões VA
      fetch('/api/credit-cards')
        .then(res => res.json())
        .then(cards => {
          const foodVoucherCards = cards.filter(
            (card: any) => card.cardType === 'FOOD_VOUCHER'
          );
          
          if (foodVoucherCards.length > 0) {
            // Mostrar notificação
            toast({
              title: "Vale Alimentação Resetado",
              description: "Seus cartões de Vale Alimentação foram automaticamente resetados para o novo mês.",
              duration: 7000,
            });
            
            // Marcar como mostrado
            localStorage.setItem(`va_reset_notification_${today}`, 'true');
            setHasShownNotification(true);
          }
        })
        .catch(error => {
          console.error('Erro ao verificar cartões VA:', error);
        });
    }
  }, [hasShownNotification]);

  return null;
} 