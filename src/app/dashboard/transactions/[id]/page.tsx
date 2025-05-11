'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from '@/components/ui/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';

interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
  icon?: string;
}

interface BankAccount {
  id: string;
  name: string;
  currentBalance: number;
}

interface CreditCard {
  id: string;
  name: string;
  limit: number;
  availableLimit: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  paymentMethod: 'CASH' | 'CREDIT' | 'DEBIT' | 'FOOD_VOUCHER';
  categoryId: string;
  bankAccountId?: string | null;
  creditCardId?: string | null;
  recurrenceType: 'SINGLE' | 'INSTALLMENT' | 'RECURRING';
  installments?: number | null;
  currentInstallment?: number | null;
}

export default function EditTransaction({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [transactionExists, setTransactionExists] = useState(true);

  // Form state
  const [transaction, setTransaction] = useState<Transaction>({
    id: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    type: 'EXPENSE',
    paymentMethod: 'DEBIT',
    bankAccountId: null,
    creditCardId: null,
    recurrenceType: 'SINGLE',
    installments: 1
  });

  // Carregar dados ao montar o componente
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Buscar a transação atual
        await fetchTransaction();
        
        // Buscar categorias, contas e cartões em paralelo
        const [categoriesRes, accountsRes, cardsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/bank-accounts'),
          fetch('/api/credit-cards')
        ]);
        
        if (!categoriesRes.ok || !accountsRes.ok || !cardsRes.ok) {
          throw new Error('Falha ao carregar dados necessários');
        }
        
        const categoriesData = await categoriesRes.json();
        const accountsData = await accountsRes.json();
        const cardsData = await cardsRes.json();
        
        // Ordenar categorias por tipo e nome
        const sortedCategories = [...categoriesData].sort((a, b) => {
          // Primeiro por tipo (EXPENSE primeiro, INCOME depois)
          if (a.type !== b.type) {
            return a.type === 'EXPENSE' ? -1 : 1;
          }
          // Depois por nome alfabeticamente
          return a.name.localeCompare(b.name);
        });
        
        setCategories(sortedCategories);
        setBankAccounts(accountsData);
        setCreditCards(cardsData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados necessários.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Buscar transação pelo ID
  const fetchTransaction = async () => {
    try {
      const response = await fetch(`/api/transactions/${id}`);
      
      if (response.status === 404) {
        setTransactionExists(false);
        toast({
          title: 'Transação não encontrada',
          description: 'A transação solicitada não existe ou foi excluída.',
          variant: 'destructive'
        });
        return;
      }
      
      if (!response.ok) {
        throw new Error('Falha ao carregar transação');
      }
      
      const data = await response.json();
      
      // Converter valores para formato adequado para os inputs
      setTransaction({
        ...data,
        amount: Math.abs(data.amount), // Sempre positivo no formulário
        date: new Date(data.date).toISOString().split('T')[0],
        installments: data.installments || 1
      });
    } catch (error) {
      console.error('Erro ao buscar transação:', error);
      throw error;
    }
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setTransaction({
        ...transaction,
        [name]: checked,
      });
    } else if (name === 'categoryId') {
      const category = categories.find((c) => c.id === value);
      setTransaction({
        ...transaction,
        [name]: value,
        type: category?.type || transaction.type,
      });
    } else if (name === 'paymentMethod') {
      // Limpar o ID do cartão ou conta dependendo do método de pagamento
      if (value === 'CREDIT') {
        setTransaction({
          ...transaction,
          paymentMethod: value,
          bankAccountId: '', // Limpar conta bancária se método for crédito
          creditCardId: creditCards.length > 0 ? creditCards[0].id : '', // Definir primeiro cartão
        });
      } else if (value === 'FOOD_VOUCHER') {
        // Para vale alimentação, não precisamos de conta ou cartão
        setTransaction({
          ...transaction,
          paymentMethod: value,
          creditCardId: '',
          bankAccountId: '',
          type: 'EXPENSE',  // Vale alimentação é sempre despesa
        });
        
        // Pré-selecionar uma categoria de alimentação, se existir
        const foodCategory = categories.find(c => 
          (c.name.toLowerCase().includes('aliment') || 
           c.name.toLowerCase().includes('comida') ||
           c.name.toLowerCase().includes('refeic')) && 
          c.type === 'EXPENSE'
        );
        
        if (foodCategory) {
          setTransaction(prev => ({
            ...prev,
            categoryId: foodCategory.id
          }));
        }
      } else {
        // Se não houver contas bancárias e o método não for crédito ou vale alimentação, mostrar pop-up
        if (bankAccounts.length === 0 && value !== 'FOOD_VOUCHER') {
          setShowAccountDialog(true);
        }
        
        setTransaction({
          ...transaction,
          paymentMethod: value,
          creditCardId: '', // Limpar cartão de crédito se método não for crédito
          bankAccountId: bankAccounts.length > 0 ? bankAccounts[0].id : '', // Definir primeira conta
        });
      }
    } else {
      setTransaction({
        ...transaction,
        [name]: value,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar dados do formulário
      if (!transaction.description || !transaction.amount || !transaction.date || !transaction.categoryId) {
        throw new Error('Por favor, preencha todos os campos obrigatórios.');
      }
      
      if (transaction.paymentMethod === 'CREDIT' && !transaction.creditCardId) {
        throw new Error('Selecione um cartão de crédito para pagamentos com cartão de crédito.');
      }
      
      if ((transaction.paymentMethod === 'DEBIT' || transaction.paymentMethod === 'CASH') && 
          !transaction.bankAccountId && bankAccounts.length > 0) {
        throw new Error('Selecione uma conta bancária para pagamentos em dinheiro ou débito.');
      }
      
      if (transaction.recurrenceType === 'INSTALLMENT' && (!transaction.installments || transaction.installments < 2)) {
        throw new Error('Para parcelamentos, o número de parcelas deve ser pelo menos 2.');
      }
      
      // Preparar dados da transação
      const amount = Math.abs(parseFloat(transaction.amount.toString()));
      
      // Construir objeto para envio
      const transactionData = {
        description: transaction.description,
        amount: transaction.type === 'EXPENSE' ? -amount : amount,
        date: transaction.date,
        type: transaction.type,
        paymentMethod: transaction.paymentMethod,
        categoryId: transaction.categoryId,
        bankAccountId: transaction.bankAccountId || null,
        creditCardId: transaction.creditCardId || null,
        recurrenceType: transaction.recurrenceType,
        installments: transaction.recurrenceType === 'INSTALLMENT' 
          ? transaction.installments 
          : null,
      };
      
      // Enviar para a API
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao atualizar transação');
      }
      
      toast({
        title: 'Transação Atualizada',
        description: 'A transação foi atualizada com sucesso.',
      });
      
      router.push('/dashboard/transactions');
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar a transação.',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  if (!transactionExists) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Transação não encontrada</h1>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm text-center">
          <p className="mb-4">A transação solicitada não existe ou foi excluída.</p>
          <Link href="/dashboard/transactions">
            <Button>Voltar para lista de transações</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Editar Transação</h1>
      </div>

      {/* Pop-up para sugerir criação de conta bancária */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nenhuma conta bancária encontrada</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Você ainda não tem nenhuma conta bancária cadastrada. Embora você possa 
              criar transações sem uma conta, é recomendado cadastrar suas contas para 
              melhor controle dos seus saldos.
            </p>
            <p className="mt-2">
              Deseja cadastrar uma conta bancária agora?
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAccountDialog(false)}>
              Continuar sem conta
            </Button>
            <Button 
              type="button" 
              onClick={() => router.push('/dashboard/accounts')}
            >
              Cadastrar conta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        {isLoading && <p className="text-center py-4">Carregando dados...</p>}
        
        {!isLoading && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium leading-none">
                  Descrição
                </label>
                <Input
                  id="description"
                  name="description"
                  value={transaction.description}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium leading-none">
                  Valor
                </label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={transaction.amount}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium leading-none">
                  Data
                </label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={transaction.date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="categoryId" className="text-sm font-medium leading-none">
                  Categoria
                </label>
                <div className="grid gap-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <select
                      id="categoryId"
                      name="categoryId"
                      value={transaction.categoryId}
                      onChange={handleChange}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Selecione uma categoria</option>
                      <optgroup label="Despesas">
                        {categories
                          .filter((category) => category.type === 'EXPENSE')
                          .map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.icon && `${category.icon} `}{category.name}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Receitas">
                        {categories
                          .filter((category) => category.type === 'INCOME')
                          .map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.icon && `${category.icon} `}{category.name}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2 max-h-48 overflow-y-auto py-2 px-1 border rounded-md">
                    {categories
                      .filter((category) => category.type === transaction.type)
                      .map((category) => (
                        <div 
                          key={category.id}
                          onClick={() => setTransaction({...transaction, categoryId: category.id})}
                          className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                            transaction.categoryId === category.id 
                              ? 'ring-2 ring-primary bg-primary/10' 
                              : ''
                          }`}
                          style={{
                            borderLeft: `4px solid ${category.color}`
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xl">{category.icon}</span>
                            <span className="text-sm font-medium truncate">{category.name}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  {categories.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      Nenhuma categoria disponível. Crie categorias primeiro.
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium leading-none">
                  Tipo de Transação
                </label>
                <select
                  id="type"
                  name="type"
                  value={transaction.type}
                  onChange={handleChange}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="INCOME">Receita</option>
                  <option value="EXPENSE">Despesa</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="paymentMethod" className="text-sm font-medium leading-none">
                  Método de Pagamento
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={transaction.paymentMethod}
                  onChange={handleChange}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="CASH">Dinheiro</option>
                  <option value="DEBIT">Débito</option>
                  <option value="CREDIT">Crédito</option>
                  <option value="FOOD_VOUCHER">Vale Alimentação</option>
                </select>
              </div>
              {transaction.paymentMethod !== 'CREDIT' && transaction.paymentMethod !== 'FOOD_VOUCHER' ? (
                <div className="space-y-2">
                  <label htmlFor="bankAccountId" className="text-sm font-medium leading-none">
                    Conta Bancária
                  </label>
                  <select
                    id="bankAccountId"
                    name="bankAccountId"
                    value={transaction.bankAccountId || ''}
                    onChange={handleChange}
                    required={false}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Selecione uma conta (opcional)</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} (R$ {account.currentBalance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                  {bankAccounts.length === 0 && (
                    <div className="flex items-center mt-1">
                      <p className="text-xs text-amber-500">
                        Nenhuma conta cadastrada. A transação será registrada sem afetar saldos.
                      </p>
                      <Button 
                        type="button" 
                        variant="link" 
                        className="text-xs px-2 py-0 h-auto" 
                        onClick={() => router.push('/dashboard/accounts')}
                      >
                        Cadastrar conta
                      </Button>
                    </div>
                  )}
                </div>
              ) : transaction.paymentMethod === 'CREDIT' ? (
                <div className="space-y-2">
                  <label htmlFor="creditCardId" className="text-sm font-medium leading-none">
                    Cartão de Crédito
                  </label>
                  <select
                    id="creditCardId"
                    name="creditCardId"
                    value={transaction.creditCardId || ''}
                    onChange={handleChange}
                    required={transaction.paymentMethod === 'CREDIT'}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Selecione um cartão</option>
                    {creditCards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.name} (Disponível: R$ {card.availableLimit.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    Vale Alimentação
                  </label>
                  <div className="flex h-10 items-center px-3 py-2 rounded-md border border-input bg-muted/50">
                    <span className="text-sm text-muted-foreground">Transação com Vale Alimentação</span>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="recurrenceType" className="text-sm font-medium leading-none">
                  Tipo de Recorrência
                </label>
                <select
                  id="recurrenceType"
                  name="recurrenceType"
                  value={transaction.recurrenceType}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="SINGLE">Transação Única</option>
                  <option value="INSTALLMENT">Parcelado</option>
                  <option value="RECURRING">Recorrente</option>
                </select>
              </div>
              {transaction.recurrenceType === 'INSTALLMENT' && (
                <div className="space-y-2">
                  <label htmlFor="installments" className="text-sm font-medium leading-none">
                    Número de Parcelas
                  </label>
                  <Input
                    id="installments"
                    name="installments"
                    type="number"
                    min="2"
                    max="48"
                    value={transaction.installments || 2}
                    onChange={handleChange}
                    required={transaction.recurrenceType === 'INSTALLMENT'}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Link href="/dashboard/transactions">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 