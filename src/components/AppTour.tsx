'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface TourStep {
  title: string;
  description: string;
  selector: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

// Definir os passos do tour
const tourSteps: TourStep[] = [
  {
    title: 'Bem-vindo ao WebFinance!',
    description: 'Vamos fazer um rápido tour para você conhecer as principais funcionalidades.',
    selector: 'body',
    position: 'center'
  },
  {
    title: 'Resumo Financeiro',
    description: 'Este é o seu resumo financeiro, com saldos gerais, receitas e despesas mensais.',
    selector: '.dashboard-summary',
    position: 'bottom'
  },
  {
    title: 'Contas Bancárias',
    description: 'Aqui você pode ver e gerenciar todas as suas contas bancárias.',
    selector: '.bank-accounts',
    position: 'top'
  },
  {
    title: 'Cartões de Crédito',
    description: 'Gerencie seus cartões de crédito e acompanhe seus limites disponíveis.',
    selector: '.credit-cards',
    position: 'top'
  },
  {
    title: 'Vale Alimentação',
    description: 'Seus cartões de vale alimentação ficam nesta seção e são resetados automaticamente todo mês.',
    selector: '.food-voucher',
    position: 'top'
  },
  {
    title: 'Transações Recentes',
    description: 'Acompanhe suas transações recentes aqui. Você pode ver todas as transações na página de Transações.',
    selector: '.transactions-section',
    position: 'top'
  },
  {
    title: 'Adicionar Transações',
    description: 'Use este botão para adicionar novas transações, como receitas e despesas.',
    selector: '.add-transaction-btn',
    position: 'left'
  },
  {
    title: 'Configurações',
    description: 'Personalize seu painel conforme suas preferências aqui.',
    selector: '.settings-btn',
    position: 'left'
  }
];

interface AppTourProps {
  run: boolean;
  onComplete: () => void;
}

const AppTour: React.FC<AppTourProps> = ({ run, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(-1);
  const [popupStyle, setPopupStyle] = useState({
    top: 0,
    left: 0,
    position: 'fixed',
    zIndex: 9999
  });

  // Iniciar ou parar o tour
  useEffect(() => {
    if (run) {
      setCurrentStep(0);
    } else {
      setCurrentStep(-1);
    }
  }, [run]);

  // Lidar com o posicionamento do popup
  useEffect(() => {
    if (currentStep >= 0 && currentStep < tourSteps.length) {
      const step = tourSteps[currentStep];
      const element = document.querySelector(step.selector);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Posicionar o popup baseado na posição especificada
        let top = 0;
        let left = 0;
        
        if (step.position === 'center') {
          top = windowHeight / 2 - 150;
          left = windowWidth / 2 - 150;
        } else if (step.position === 'top') {
          top = rect.top - 150;
          left = rect.left + rect.width / 2 - 150;
        } else if (step.position === 'bottom') {
          top = rect.bottom + 20;
          left = rect.left + rect.width / 2 - 150;
        } else if (step.position === 'left') {
          top = rect.top + rect.height / 2 - 75;
          left = rect.left - 320;
        } else if (step.position === 'right') {
          top = rect.top + rect.height / 2 - 75;
          left = rect.right + 20;
        }
        
        // Ajustar para não sair da tela
        top = Math.max(20, Math.min(windowHeight - 200, top));
        left = Math.max(20, Math.min(windowWidth - 320, left));
        
        setPopupStyle({
          top,
          left,
          position: 'fixed',
          zIndex: 9999
        });
        
        // Rolar para o elemento se necessário
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [currentStep]);

  // Avançar para o próximo passo
  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  // Voltar para o passo anterior
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Finalizar o tour
  const completeTour = () => {
    setCurrentStep(-1);
    localStorage.setItem('appTourCompleted', 'true');
    onComplete();
  };

  // Não renderizar nada se não estiver rodando
  if (currentStep < 0) {
    return null;
  }

  // Informações do passo atual
  const currentTourStep = tourSteps[currentStep];
  
  // Estilo CSS para o overlay
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9998
  } as React.CSSProperties;

  return (
    <>
      {/* Overlay escuro */}
      <div style={overlayStyle} onClick={completeTour} />
      
      {/* Popup do tour */}
      <div 
        style={popupStyle as React.CSSProperties} 
        className="bg-white w-[300px] rounded-lg shadow-xl p-4 border border-gray-200"
      >
        <div className="text-lg font-bold mb-2 text-emerald-600">
          {currentTourStep.title}
        </div>
        <div className="text-sm mb-4">
          {currentTourStep.description}
        </div>
        <div className="flex justify-between items-center">
          <div>
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={prevStep}>
                Anterior
              </Button>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {currentStep + 1} / {tourSteps.length}
          </div>
          <div>
            {currentStep < tourSteps.length - 1 ? (
              <Button size="sm" onClick={nextStep}>
                Próximo
              </Button>
            ) : (
              <Button size="sm" onClick={completeTour}>
                Finalizar
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AppTour; 