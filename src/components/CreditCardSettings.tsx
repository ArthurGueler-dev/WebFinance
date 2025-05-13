"use client";

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { CreditCard } from 'lucide-react';

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

interface CreditCardSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CreditCardData | null;
  onUpdateSettings: (cardId: string, settings: any) => Promise<void>;
}

export default function CreditCardSettings({
  open,
  onOpenChange,
  card,
  onUpdateSettings
}: CreditCardSettingsProps) {
  const [tab, setTab] = useState('appearance');
  const [loading, setLoading] = useState(false);
  const [previewColor, setPreviewColor] = useState('#8b5cf6'); // Roxo padrão para cartões de crédito
  
  const [settings, setSettings] = useState({
    // Aparência
    color: '#8b5cf6',
    showInDashboard: true,
    
    // Notificações
    dueReminder: true,
    dueReminderDays: 3,
    closingReminder: true,
    closingReminderDays: 2,
    
    // Avançado
    useCustomLimit: false,
    customLimit: 0,
    automaticPayment: false,
    bankAccountForPayment: '',
  });
  
  // Atualiza as configurações quando o cartão muda
  useEffect(() => {
    if (card) {
      // Configuração padrão por tipo de cartão
      let defaultColor = '#8b5cf6'; // Roxo para cartões de crédito
      
      if (card.cardType === 'DEBIT') {
        defaultColor = '#3b82f6'; // Azul para cartões de débito
      } else if (card.cardType === 'FOOD_VOUCHER') {
        defaultColor = '#22c55e'; // Verde para vales alimentação
      }
      
      // Tentar carregar do localStorage primeiro
      try {
        const savedSettings = localStorage.getItem(`credit-card-settings-${card.id}`);
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          if (parsedSettings.color) {
            // Se encontrar configurações salvas, usar elas
            setSettings({
              ...settings,
              color: parsedSettings.color,
              customLimit: card.limit
            });
            
            setPreviewColor(parsedSettings.color);
            return;
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações do localStorage:', error);
      }
      
      // Se não encontrar no localStorage ou ocorrer erro, usar cor do cartão ou cor padrão
      setSettings({
        ...settings,
        color: card.color || defaultColor,
        customLimit: card.limit
      });
      
      setPreviewColor(card.color || defaultColor);
    }
  }, [card]);
  
  const getCardTypeLabel = () => {
    if (!card) return 'Cartão';
    
    switch(card.cardType) {
      case 'FOOD_VOUCHER':
        return 'Vale Alimentação';
      case 'DEBIT':
        return 'Cartão de Débito';
      default:
        return 'Cartão de Crédito';
    }
  };
  
  const getCardGradient = (color: string) => {
    return `linear-gradient(135deg, ${color}20, ${color}50)`;
  };
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setSettings({...settings, color: newColor});
    setPreviewColor(newColor);
  };
  
  const handleSave = async () => {
    if (!card) return;
    
    setLoading(true);
    
    try {
      // Salvar no localStorage para persistência local
      localStorage.setItem(`credit-card-settings-${card.id}`, JSON.stringify({
        color: settings.color,
        // Outras configurações que quisermos persistir
      }));
      
      // Chamar a API para simular o salvamento no servidor
      await onUpdateSettings(card.id, {
        color: settings.color,
        // Outras configurações seriam enviadas aqui
      });
      
      toast({
        title: "Configurações salvas",
        description: `As configurações do cartão ${card.name} foram atualizadas com sucesso.`
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Configurações do Cartão</DialogTitle>
        </DialogHeader>

        {card && (
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="appearance">Aparência</TabsTrigger>
              <TabsTrigger value="notifications">Alertas</TabsTrigger>
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
            </TabsList>
            
            <TabsContent value="appearance" className="space-y-4">
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">{card.name}</h3>
                
                {/* Preview do cartão */}
                <div
                  className="w-full h-40 rounded-xl border-t-4 p-4 flex flex-col justify-between"
                  style={{ 
                    background: getCardGradient(previewColor),
                    borderTopColor: previewColor
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-background/80 shadow-sm">
                        <CreditCard size={16} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{card.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getCardTypeLabel()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Limite</span>
                      <span className="text-xs">R$ {card.limit.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Vencimento: dia {card.dueDay} • Fechamento: dia {card.closingDay}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color">Cor do Cartão</Label>
                <div className="flex items-center gap-3">
                  <Input 
                    id="color" 
                    type="color" 
                    value={settings.color}
                    className="w-12 h-10 p-1"
                    onChange={handleColorChange}
                  />
                  <div>
                    <div className="text-sm">{settings.color}</div>
                    <div className="text-xs text-muted-foreground">Cor personalizada para identificação visual</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label htmlFor="showInDashboard">Mostrar no Dashboard</Label>
                  <p className="text-xs text-muted-foreground">
                    Exibe este cartão na tela inicial
                  </p>
                </div>
                <Switch 
                  id="showInDashboard" 
                  checked={settings.showInDashboard}
                  onCheckedChange={(checked) => setSettings({...settings, showInDashboard: checked})}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dueReminder">Lembrete de Vencimento</Label>
                  <p className="text-xs text-muted-foreground">
                    Receba lembrete antes da data de vencimento
                  </p>
                </div>
                <Switch 
                  id="dueReminder" 
                  checked={settings.dueReminder}
                  onCheckedChange={(checked) => setSettings({...settings, dueReminder: checked})}
                />
              </div>
              
              {settings.dueReminder && (
                <div className="space-y-2 ml-5 border-l-2 pl-4 border-muted">
                  <Label htmlFor="dueReminderDays">Dias de Antecedência</Label>
                  <Input 
                    id="dueReminderDays" 
                    type="number"
                    min="1"
                    max="15"
                    value={settings.dueReminderDays}
                    onChange={(e) => setSettings({...settings, dueReminderDays: parseInt(e.target.value) || 3})}
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label htmlFor="closingReminder">Lembrete de Fechamento</Label>
                  <p className="text-xs text-muted-foreground">
                    Receba lembrete antes da data de fechamento
                  </p>
                </div>
                <Switch 
                  id="closingReminder" 
                  checked={settings.closingReminder}
                  onCheckedChange={(checked) => setSettings({...settings, closingReminder: checked})}
                />
              </div>
              
              {settings.closingReminder && (
                <div className="space-y-2 ml-5 border-l-2 pl-4 border-muted">
                  <Label htmlFor="closingReminderDays">Dias de Antecedência</Label>
                  <Input 
                    id="closingReminderDays" 
                    type="number"
                    min="1"
                    max="10"
                    value={settings.closingReminderDays}
                    onChange={(e) => setSettings({...settings, closingReminderDays: parseInt(e.target.value) || 2})}
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="useCustomLimit">Usar Limite Personalizado</Label>
                  <p className="text-xs text-muted-foreground">
                    Sobrescreve o limite oficial do cartão
                  </p>
                </div>
                <Switch 
                  id="useCustomLimit" 
                  checked={settings.useCustomLimit}
                  onCheckedChange={(checked) => setSettings({...settings, useCustomLimit: checked})}
                />
              </div>
              
              {settings.useCustomLimit && (
                <div className="space-y-2 ml-5 border-l-2 pl-4 border-muted">
                  <Label htmlFor="customLimit">Limite Personalizado (R$)</Label>
                  <Input 
                    id="customLimit" 
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.customLimit}
                    onChange={(e) => setSettings({...settings, customLimit: parseFloat(e.target.value) || card.limit})}
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label htmlFor="automaticPayment">Pagamento Automático</Label>
                  <p className="text-xs text-muted-foreground">
                    {card.cardType === 'CREDIT' ? 
                      'Pagar fatura automaticamente no vencimento' : 
                      'Programar recarga automática'}
                  </p>
                </div>
                <Switch 
                  id="automaticPayment" 
                  checked={settings.automaticPayment}
                  onCheckedChange={(checked) => setSettings({...settings, automaticPayment: checked})}
                />
              </div>
              
              {settings.automaticPayment && (
                <div className="space-y-2 ml-5 border-l-2 pl-4 border-muted opacity-50">
                  <Label htmlFor="bankAccountForPayment">Conta para Pagamento</Label>
                  <select
                    id="bankAccountForPayment"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={settings.bankAccountForPayment}
                    onChange={(e) => setSettings({...settings, bankAccountForPayment: e.target.value})}
                    disabled={true} // Simulação, seria conectado às contas do usuário
                  >
                    <option value="">Selecione uma conta</option>
                    <option value="disabled" disabled>Função em desenvolvimento</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recurso em desenvolvimento
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 