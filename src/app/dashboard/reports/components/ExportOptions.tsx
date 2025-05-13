'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { FilePdf, FileSpreadsheet, Mail, Share2, Download } from 'lucide-react';

interface ExportOptionsProps {
  isLoading: boolean;
  hasData: boolean;
  onExport: (format: 'pdf' | 'excel' | 'csv', options: any) => Promise<void>;
  onShare: (method: 'email' | 'whatsapp', recipient: string, options: any) => Promise<void>;
}

export function ExportOptions({ isLoading, hasData, onExport, onShare }: ExportOptionsProps) {
  const [recipient, setRecipient] = useState('');
  const [exportOptions, setExportOptions] = useState({
    includeCharts: true,
    includeTransactions: true,
    includeInsights: true,
    includeSummary: true
  });

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!hasData) {
      toast({
        title: "Não há dados para exportar",
        description: "Aplique filtros para visualizar e exportar dados.",
        variant: "destructive"
      });
      return;
    }

    try {
      await onExport(format, exportOptions);
      toast({
        title: "Exportação concluída",
        description: `Relatório exportado com sucesso no formato ${format.toUpperCase()}.`
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async (method: 'email' | 'whatsapp') => {
    if (!hasData) {
      toast({
        title: "Não há dados para compartilhar",
        description: "Aplique filtros para visualizar e compartilhar dados.",
        variant: "destructive"
      });
      return;
    }

    if (!recipient) {
      toast({
        title: "Destinatário necessário",
        description: `Informe um ${method === 'email' ? 'e-mail' : 'número de telefone'} válido.`,
        variant: "destructive"
      });
      return;
    }

    try {
      await onShare(method, recipient, exportOptions);
      toast({
        title: "Compartilhamento concluído",
        description: `Relatório compartilhado com sucesso via ${method === 'email' ? 'e-mail' : 'WhatsApp'}.`
      });
    } catch (error) {
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar o relatório. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleOptionChange = (option: string, checked: boolean) => {
    setExportOptions({
      ...exportOptions,
      [option]: checked
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          className="flex items-center gap-2" 
          variant="outline"
          disabled={isLoading || !hasData}
        >
          <Share2 className="h-4 w-4" />
          Exportar & Compartilhar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar e Compartilhar Relatório</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="export" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Exportar</TabsTrigger>
            <TabsTrigger value="share">Compartilhar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="mt-4 space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Opções de Conteúdo</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeCharts" 
                    checked={exportOptions.includeCharts}
                    onCheckedChange={(checked) => 
                      handleOptionChange('includeCharts', Boolean(checked))
                    }
                  />
                  <Label htmlFor="includeCharts">Incluir gráficos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeSummary" 
                    checked={exportOptions.includeSummary}
                    onCheckedChange={(checked) => 
                      handleOptionChange('includeSummary', Boolean(checked))
                    }
                  />
                  <Label htmlFor="includeSummary">Incluir resumo financeiro</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeTransactions" 
                    checked={exportOptions.includeTransactions}
                    onCheckedChange={(checked) => 
                      handleOptionChange('includeTransactions', Boolean(checked))
                    }
                  />
                  <Label htmlFor="includeTransactions">Incluir transações</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeInsights" 
                    checked={exportOptions.includeInsights}
                    onCheckedChange={(checked) => 
                      handleOptionChange('includeInsights', Boolean(checked))
                    }
                  />
                  <Label htmlFor="includeInsights">Incluir insights e recomendações</Label>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="flex items-center justify-center gap-2"
                onClick={() => handleExport('pdf')}
                disabled={isLoading}
              >
                <FilePdf className="h-4 w-4" />
                Exportar PDF
              </Button>
              <Button
                className="flex items-center justify-center gap-2"
                variant="outline"
                onClick={() => handleExport('excel')}
                disabled={isLoading}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel
              </Button>
              <Button
                className="flex items-center justify-center gap-2 col-span-2"
                variant="secondary"
                onClick={() => handleExport('csv')}
                disabled={isLoading}
              >
                <Download className="h-4 w-4" />
                Baixar CSV
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="share" className="mt-4 space-y-4">
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Endereço de Email</Label>
                  <Input
                    id="email"
                    placeholder="email@exemplo.com"
                    type="email"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                </div>
                
                <Button
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => handleShare('email')}
                  disabled={isLoading || !recipient}
                >
                  <Mail className="h-4 w-4" />
                  Enviar por Email
                </Button>
              </TabsContent>
              
              <TabsContent value="whatsapp" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">Número do WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    placeholder="+55 (00) 00000-0000"
                    type="tel"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                </div>
                
                <Button
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => handleShare('whatsapp')}
                  disabled={isLoading || !recipient}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="h-4 w-4">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                  </svg>
                  Enviar por WhatsApp
                </Button>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 