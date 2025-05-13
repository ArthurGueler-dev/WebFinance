"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  Pencil, 
  Trash, 
  Eye, 
  Settings 
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface BankAccount {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface BankAccountCardProps {
  account: BankAccount;
  onEdit: (account: BankAccount) => void;
  onDelete: (account: BankAccount) => void;
  onExtract: (account: BankAccount) => void;
  onSettings: (account: BankAccount) => void;
}

export default function BankAccountCard({
  account,
  onEdit,
  onDelete,
  onExtract,
  onSettings
}: BankAccountCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [accountColor, setAccountColor] = useState<string | null>(null);
  
  // Buscar a cor personalizada do localStorage quando o componente é montado
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(`bank-account-settings-${account.id}`);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.color) {
          setAccountColor(settings.color);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar configurações de cor da conta:', error);
    }
  }, [account.id]);
  
  const getAccountGradient = () => {
    // Se tiver uma cor personalizada, use-a
    if (accountColor) {
      return `linear-gradient(135deg, ${accountColor}20, ${accountColor}40)`;
    }
    
    // Caso contrário, gere um gradiente baseado no nome
    const hash = account.name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const hue1 = hash % 360;
    const hue2 = (hue1 + 40) % 360;
    return `linear-gradient(135deg, hsla(${hue1}, 80%, 50%, 0.1), hsla(${hue2}, 80%, 60%, 0.1))`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card 
      className="overflow-hidden transition-all duration-200 hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        background: getAccountGradient(),
        ...(accountColor && { borderTop: `3px solid ${accountColor}` })
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{account.name}</h3>
            <p className="text-xs text-muted-foreground">
              Atualizado em: {formatDate(account.updatedAt)}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onExtract(account)} className="flex items-center gap-2">
                <Eye className="h-4 w-4 opacity-70" />
                <span>Ver Extrato</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(account)} className="flex items-center gap-2">
                <Pencil className="h-4 w-4 opacity-70" />
                <span>Editar Conta</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSettings(account)} className="flex items-center gap-2">
                <Settings className="h-4 w-4 opacity-70" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(account)} 
                className="flex items-center gap-2 text-red-600 focus:text-red-600"
              >
                <Trash className="h-4 w-4 opacity-70" />
                <span>Excluir</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="mt-6 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Saldo Inicial</span>
            <span className="text-sm">R$ {formatCurrency(account.initialBalance)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Saldo Atual</span>
            <span className={`text-base font-bold ${account.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {formatCurrency(account.currentBalance)}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between bg-muted/30 p-2 px-4">
        <span className="text-xs text-muted-foreground">
          ID: {account.id.substring(0, 8)}...
        </span>
        <div className={`transform transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <Button variant="ghost" size="sm" onClick={() => onExtract(account)} className="h-7 text-xs">
            Ver Extrato
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 