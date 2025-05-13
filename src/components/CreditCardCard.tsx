"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  Pencil, 
  Trash, 
  Eye, 
  Settings,
  CreditCard,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface CreditCardData {
  id: string;
  name: string;
  limit: number;
  dueDay: number;
  closingDay: number;
  cardType: 'CREDIT' | 'DEBIT' | 'FOOD_VOUCHER';
  availableLimit: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  color?: string;
}

interface CreditCardCardProps {
  card: CreditCardData;
  onEdit: (card: CreditCardData) => void;
  onDelete: (card: CreditCardData) => void;
  onTransactions: (card: CreditCardData) => void;
  onSettings: (card: CreditCardData) => void;
}

export default function CreditCardCard({
  card,
  onEdit,
  onDelete,
  onTransactions,
  onSettings
}: CreditCardCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [savedColor, setSavedColor] = useState<string | null>(null);
  
  // Carregar as configurações salvas quando o componente é montado
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(`credit-card-settings-${card.id}`);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.color) {
          setSavedColor(settings.color);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do localStorage:', error);
    }
  }, [card.id]);
  
  const getCardGradient = () => {
    // Primeiro verificar no card.color (vindo da API)
    if (card.color) {
      const baseColor = card.color;
      return `linear-gradient(135deg, ${baseColor}20, ${baseColor}50)`;
    }
    
    // Depois verificar no savedColor (do useState)
    if (savedColor) {
      return `linear-gradient(135deg, ${savedColor}20, ${savedColor}50)`;
    }
    
    // Tentar buscar do localStorage novamente (fallback, não deve ser necessário com o useEffect)
    try {
      const savedSettings = localStorage.getItem(`credit-card-settings-${card.id}`);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.color) {
          return `linear-gradient(135deg, ${settings.color}20, ${settings.color}50)`;
        }
      }
    } catch (error) {
      console.error('Erro ao buscar configurações do localStorage:', error);
    }
    
    // Caso contrário, gere um gradiente baseado no nome e tipo do cartão
    const hash = card.name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    
    // Cores diferentes por tipo de cartão
    let hue1, hue2;
    if (card.cardType === 'FOOD_VOUCHER') {
      // Tons de verde para cartões de alimentação
      hue1 = 120 + (hash % 40);
      hue2 = hue1 + 20;
    } else if (card.cardType === 'DEBIT') {
      // Tons de azul para cartões de débito
      hue1 = 200 + (hash % 40);
      hue2 = hue1 + 20;
    } else {
      // Tons de roxo/violeta para cartões de crédito
      hue1 = 260 + (hash % 60);
      hue2 = hue1 + 30;
    }
    
    return `linear-gradient(135deg, hsla(${hue1}, 80%, 40%, 0.15), hsla(${hue2}, 80%, 50%, 0.25))`;
  };

  const getBorderColor = () => {
    // Primeiro verificar no card.color (vindo da API)
    if (card.color) {
      return card.color;
    }
    
    // Depois verificar no savedColor (do useState)
    if (savedColor) {
      return savedColor;
    }
    
    // Tentar buscar do localStorage novamente (fallback)
    try {
      const savedSettings = localStorage.getItem(`credit-card-settings-${card.id}`);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.color) {
          return settings.color;
        }
      }
    } catch (error) {
      console.error('Erro ao buscar configurações do localStorage:', error);
    }
    
    // Cores padrão por tipo
    switch(card.cardType) {
      case 'FOOD_VOUCHER':
        return '#22c55e'; // Verde
      case 'DEBIT':
        return '#3b82f6'; // Azul
      default:
        return '#8b5cf6'; // Roxo
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const cardTypeLabel = () => {
    switch(card.cardType) {
      case 'FOOD_VOUCHER':
        return 'Vale Alimentação';
      case 'DEBIT':
        return 'Débito';
      default:
        return 'Crédito';
    }
  };
  
  const usedLimit = card.limit - card.availableLimit;
  const usedPercentage = (usedLimit / card.limit) * 100;

  return (
    <Card 
      className="overflow-hidden transition-all duration-200 hover:shadow-md border-t-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        background: getCardGradient(),
        borderTopColor: getBorderColor()
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-background/80 shadow-sm">
              <CreditCard size={16} className="text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{card.name}</h3>
              <p className="text-xs text-muted-foreground">
                {cardTypeLabel()}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onTransactions(card)} className="flex items-center gap-2">
                <Eye className="h-4 w-4 opacity-70" />
                <span>Ver Transações</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(card)} className="flex items-center gap-2">
                <Pencil className="h-4 w-4 opacity-70" />
                <span>Editar Cartão</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSettings(card)} className="flex items-center gap-2">
                <Settings className="h-4 w-4 opacity-70" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(card)} 
                className="flex items-center gap-2 text-red-600 focus:text-red-600"
              >
                <Trash className="h-4 w-4 opacity-70" />
                <span>Excluir</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Limite Total</span>
            <span className="text-sm">R$ {formatCurrency(card.limit)}</span>
          </div>
          
          {/* Barra de progresso de uso do limite */}
          <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className={`h-full ${usedPercentage > 80 ? 'bg-red-500' : 'bg-primary'}`}
              style={{ width: `${Math.min(usedPercentage, 100)}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Limite Disponível</span>
            <span className={`text-base font-bold ${usedPercentage > 80 ? 'text-red-600' : 'text-green-600'}`}>
              R$ {formatCurrency(card.availableLimit)}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <Calendar size={12} />
            <div className="flex gap-0.5">
              <span>Fechamento: dia {card.closingDay}</span>
              <span>•</span>
              <span>Vencimento: dia {card.dueDay}</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between bg-muted/30 p-2 px-4">
        <span className="text-xs text-muted-foreground">
          Atualizado: {formatDate(card.updatedAt)}
        </span>
        <Button 
          variant="ghost" 
          size="sm"
          asChild
          className={`transform transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        >
          <Link href={`/dashboard/credit-cards/${card.id}`} className="flex items-center gap-1">
            <span className="text-xs">Detalhes</span>
            <ChevronRight size={14} />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 