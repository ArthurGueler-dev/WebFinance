import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WelcomeModalProps {
  open: boolean;
  onStartTour: () => void;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ open, onStartTour, onClose }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Bem-vindo ao WebFinance!</DialogTitle>
          <DialogDescription className="pt-4">
            <p className="mb-4">
              Obrigado por escolher o WebFinance para gerenciar suas finanças. 
              Nosso aplicativo oferece diversas ferramentas para ajudar você a 
              controlar suas finanças pessoais.
            </p>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="mr-3 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 7h-9"></path>
                    <path d="M14 17H5"></path>
                    <circle cx="17" cy="17" r="3"></circle>
                    <circle cx="7" cy="7" r="3"></circle>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Contas e Cartões</h3>
                  <p className="text-sm text-muted-foreground">
                    Gerencie suas contas bancárias e cartões de crédito em um só lugar
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-3 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18"></path>
                    <path d="m19 9-5 5-4-4-3 3"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Relatórios</h3>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe seus gastos e receitas com relatórios detalhados
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-3 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                    <line x1="2" x2="22" y1="10" y2="10"></line>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Vale Alimentação</h3>
                  <p className="text-sm text-muted-foreground">
                    Controle do seu saldo de Vale Alimentação com reset automático mensal
                  </p>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Pular Tour
          </Button>
          <Button 
            onClick={onStartTour}
            className="flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 18L12 22L16 18"></path>
              <path d="M12 2V22"></path>
            </svg>
            Iniciar Tour Guiado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal; 