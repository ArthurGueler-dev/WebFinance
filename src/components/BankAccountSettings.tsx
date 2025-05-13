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

interface BankAccount {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface BankAccountSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: BankAccount | null;
}

export default function BankAccountSettings({
  open,
  onOpenChange,
  account
}: BankAccountSettingsProps) {
  const [tab, setTab] = useState('general');
  const [settings, setSettings] = useState({
    // Configurações Gerais
    alias: '',
    icon: 'default',
    color: '#3b82f6', // Azul como cor padrão
    showInDashboard: true,
    
    // Notificações
    lowBalanceAlert: false,
    lowBalanceThreshold: 100,
    monthlyReport: false,
    transactionNotification: true,
    
    // Exportação
    exportFormat: 'csv',
    includeHiddenTransactions: false,
    dateFormat: 'dd/mm/yyyy',
  });
  
  const [loading, setLoading] = useState(false);
  
  // Atualiza as configurações quando a conta muda
  useEffect(() => {
    if (account) {
      // Tentar carregar do localStorage primeiro
      try {
        const savedSettings = localStorage.getItem(`bank-account-settings-${account.id}`);
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          // Se encontrar configurações salvas, usar elas
          setSettings(prev => ({
            ...prev,
            ...parsedSettings,
            alias: account.name,
          }));
          return;
        }
      } catch (error) {
        console.error('Erro ao carregar configurações do localStorage:', error);
      }
      
      // Se não encontrar no localStorage, usar configurações padrão
      setSettings(prev => ({
        ...prev,
        alias: account.name,
      }));
    }
  }, [account]);
  
  const handleSave = async () => {
    if (!account) return;
    
    setLoading(true);
    
    try {
      // Salvar no localStorage para persistência local
      localStorage.setItem(`bank-account-settings-${account.id}`, JSON.stringify({
        color: settings.color,
        icon: settings.icon,
        showInDashboard: settings.showInDashboard,
        lowBalanceAlert: settings.lowBalanceAlert,
        lowBalanceThreshold: settings.lowBalanceThreshold,
        monthlyReport: settings.monthlyReport,
        transactionNotification: settings.transactionNotification,
        exportFormat: settings.exportFormat,
        includeHiddenTransactions: settings.includeHiddenTransactions,
        dateFormat: settings.dateFormat,
      }));
      
      // Simular atraso da API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Configurações salvas",
        description: `As configurações da conta ${account.name} foram atualizadas com sucesso.`
      });
      
      onOpenChange(false);
    } catch (error) {
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
          <DialogTitle className="text-xl">Configurações da Conta</DialogTitle>
        </DialogHeader>

        {account && (
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="notifications">Notificações</TabsTrigger>
              <TabsTrigger value="export">Exportação</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alias">Nome/Apelido</Label>
                <Input 
                  id="alias" 
                  value={settings.alias} 
                  onChange={(e) => setSettings({...settings, alias: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color">Cor</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="color" 
                    type="color" 
                    value={settings.color}
                    className="w-12 h-8 p-1"
                    onChange={(e) => setSettings({...settings, color: e.target.value})}
                  />
                  <span className="text-sm text-muted-foreground">
                    Cor para identificação visual da conta
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showInDashboard">Mostrar no Dashboard</Label>
                  <p className="text-xs text-muted-foreground">
                    Exibe esta conta na tela inicial
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
                  <Label htmlFor="lowBalanceAlert">Alerta de Saldo Baixo</Label>
                  <p className="text-xs text-muted-foreground">
                    Notifica quando o saldo estiver abaixo do limite
                  </p>
                </div>
                <Switch 
                  id="lowBalanceAlert" 
                  checked={settings.lowBalanceAlert}
                  onCheckedChange={(checked) => setSettings({...settings, lowBalanceAlert: checked})}
                />
              </div>
              
              {settings.lowBalanceAlert && (
                <div className="space-y-2">
                  <Label htmlFor="lowBalanceThreshold">Limite de Saldo Baixo (R$)</Label>
                  <Input 
                    id="lowBalanceThreshold" 
                    type="number"
                    value={settings.lowBalanceThreshold}
                    onChange={(e) => setSettings({...settings, lowBalanceThreshold: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="10"
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="monthlyReport">Relatório Mensal</Label>
                  <p className="text-xs text-muted-foreground">
                    Receba um resumo mensal de movimentações
                  </p>
                </div>
                <Switch 
                  id="monthlyReport" 
                  checked={settings.monthlyReport}
                  onCheckedChange={(checked) => setSettings({...settings, monthlyReport: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="transactionNotification">Notificações de Transações</Label>
                  <p className="text-xs text-muted-foreground">
                    Notifica sobre cada nova transação nesta conta
                  </p>
                </div>
                <Switch 
                  id="transactionNotification" 
                  checked={settings.transactionNotification}
                  onCheckedChange={(checked) => setSettings({...settings, transactionNotification: checked})}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="export" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exportFormat">Formato de Exportação</Label>
                <select 
                  id="exportFormat"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  value={settings.exportFormat}
                  onChange={(e) => setSettings({...settings, exportFormat: e.target.value})}
                >
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="includeHiddenTransactions">Incluir Transações Ocultas</Label>
                  <p className="text-xs text-muted-foreground">
                    Inclui transações arquivadas nos extratos
                  </p>
                </div>
                <Switch 
                  id="includeHiddenTransactions" 
                  checked={settings.includeHiddenTransactions}
                  onCheckedChange={(checked) => setSettings({...settings, includeHiddenTransactions: checked})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Formato de Data</Label>
                <select 
                  id="dateFormat"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  value={settings.dateFormat}
                  onChange={(e) => setSettings({...settings, dateFormat: e.target.value})}
                >
                  <option value="dd/mm/yyyy">DD/MM/AAAA</option>
                  <option value="mm/dd/yyyy">MM/DD/AAAA</option>
                  <option value="yyyy-mm-dd">AAAA-MM-DD</option>
                </select>
              </div>
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