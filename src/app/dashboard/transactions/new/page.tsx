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

export default function NewTransaction() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [showAccountDialog, setShowAccountDialog] = useState(false);

  // Form state
  const [transaction, setTransaction] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    type: 'EXPENSE',
    paymentMethod: 'DEBIT',
    bankAccountId: '',
    creditCardId: '',
    recurrenceType: 'SINGLE',
    installments: '1',
  });

  // Carregar dados ao montar o componente
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
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
        
        // Definir valores padrão se houver dados disponíveis
        if (sortedCategories.length > 0) {
          const defaultCategory = sortedCategories.find((c: Category) => c.type === 'EXPENSE');
          if (defaultCategory) {
            setTransaction(prev => ({
              ...prev, 
              categoryId: defaultCategory.id
            }));
          }
        }
        
        if (accountsData.length > 0) {
          setTransaction(prev => ({
            ...prev,
            bankAccountId: accountsData[0].id
          }));
        } else {
          // Se não houver contas bancárias e o método inicial for dinheiro ou débito, mostrar diálogo
          setTransaction(prev => {
            // Verificar se o método não é crédito
            if (prev.paymentMethod !== 'CREDIT') {
              // Agendar a exibição do diálogo para depois que o componente terminar de renderizar
              setTimeout(() => setShowAccountDialog(true), 100);
            }
            return prev;
          });
        }
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
  }, []);

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
      } else {
        // Se não houver contas bancárias e o método não for crédito, mostrar pop-up
        if (bankAccounts.length === 0) {
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
      
      if (transaction.recurrenceType === 'INSTALLMENT' && parseInt(transaction.installments) < 2) {
        throw new Error('Para parcelamentos, o número de parcelas deve ser pelo menos 2.');
      }
      
      // Preparar dados da transação
      const amount = Math.abs(parseFloat(transaction.amount));
      
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
          ? parseInt(transaction.installments) 
          : null,
      };
      
      // Enviar para a API
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao criar transação');
      }
      
      toast({
        title: 'Transação Adicionada',
        description: 'A transação foi criada com sucesso.',
      });
      
      router.push('/dashboard/transactions');
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao salvar a transação.',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Nova Transação</h1>
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
                </select>
              </div>
              {transaction.paymentMethod !== 'CREDIT' ? (
                <div className="space-y-2">
                  <label htmlFor="bankAccountId" className="text-sm font-medium leading-none">
                    Conta Bancária
                  </label>
                  <select
                    id="bankAccountId"
                    name="bankAccountId"
                    value={transaction.bankAccountId}
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
              ) : (
                <div className="space-y-2">
                  <label htmlFor="creditCardId" className="text-sm font-medium leading-none">
                    Cartão de Crédito
                  </label>
                  <select
                    id="creditCardId"
                    name="creditCardId"
                    value={transaction.creditCardId}
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
                    value={transaction.installments}
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
                {isLoading ? 'Salvando...' : 'Salvar Transação'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 