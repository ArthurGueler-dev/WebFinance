'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from '@/components/ui/use-toast';
import CategorySelector from '@/components/category-selector';
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
  cardType: 'CREDIT' | 'DEBIT' | 'FOOD_VOUCHER';
}

export default function NewTransaction() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [showAccountDialog, setShowAccountDialog] = useState(false);

  // Define o estado inicial para o formulário
  interface TransactionForm {
    description: string;
    amount: string;
    date: string;
    categoryId: string;
    type: 'INCOME' | 'EXPENSE';
    paymentMethod: 'CASH' | 'DEBIT' | 'CREDIT' | 'FOOD_VOUCHER';
    bankAccountId: string;
    creditCardId: string;
    recurrenceType: 'SINGLE' | 'INSTALLMENT' | 'RECURRING';
    installments: string;
  }

  const [transaction, setTransaction] = useState<TransactionForm>({
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
    } else if (name === 'type') {
      // Quando mudar o tipo para receita, ajustar as opções automaticamente
      if (value === 'INCOME') {
        // Para receitas, usar preferencialmente conta bancária
        setTransaction({
          ...transaction,
          type: value,
          paymentMethod: 'DEBIT', // Padrão para receitas
          creditCardId: '',
          bankAccountId: bankAccounts.length > 0 ? bankAccounts[0].id : '',
        });
      } else {
        setTransaction({
          ...transaction,
          type: value,
        });
      }
    } else if (name === 'paymentMethod') {
      // Tratar receitas de forma especial
      if (transaction.type === 'INCOME') {
        // Para receitas, sempre direcionar para conta bancária
        setTransaction({
          ...transaction,
          paymentMethod: value,
          creditCardId: '',
          bankAccountId: bankAccounts.length > 0 ? bankAccounts[0].id : '',
        });
        
        // Mostrar diálogo se não houver contas bancárias
        if (bankAccounts.length === 0) {
          setShowAccountDialog(true);
        }
      } else if (value === 'CREDIT') {
        // Filtrar apenas cartões de CRÉDITO
        const creditOnlyCards = creditCards.filter(card => card.cardType === 'CREDIT');
        setTransaction({
          ...transaction,
          paymentMethod: value,
          bankAccountId: '', // Limpar conta bancária se método for crédito
          creditCardId: creditOnlyCards.length > 0 ? creditOnlyCards[0].id : '', // Definir primeiro cartão de crédito
        });
      } else if (value === 'DEBIT') {
        // Para despesas, verificar se há cartões de débito
        // Para receitas, ir direto para contas bancárias
        if (transaction.type === 'EXPENSE') {
          const debitOnlyCards = creditCards.filter(card => card.cardType === 'DEBIT');
          
          if (debitOnlyCards.length > 0) {
            setTransaction({
              ...transaction,
              paymentMethod: value,
              creditCardId: debitOnlyCards[0].id,
              bankAccountId: '', 
            });
          } else {
            // Se não houver cartão de débito, usar conta bancária
            setTransaction({
              ...transaction,
              paymentMethod: value,
              creditCardId: '', 
              bankAccountId: bankAccounts.length > 0 ? bankAccounts[0].id : '',
            });
          }
        } else {
          // Para receitas (INCOME), sempre usar conta bancária
          setTransaction({
            ...transaction,
            paymentMethod: value,
            creditCardId: '',
            bankAccountId: bankAccounts.length > 0 ? bankAccounts[0].id : '',
          });
        }
      } else if (value === 'FOOD_VOUCHER') {
        // Filtrar apenas cartões de VALE ALIMENTAÇÃO
        const foodVoucherCards = creditCards.filter(card => card.cardType === 'FOOD_VOUCHER');
        
        setTransaction({
          ...transaction,
          paymentMethod: value,
          creditCardId: foodVoucherCards.length > 0 ? foodVoucherCards[0].id : '',
          bankAccountId: '',
          type: 'EXPENSE' as 'EXPENSE',  // Vale alimentação é sempre despesa
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
        // Para CASH ou outros métodos
        // Se não houver contas bancárias e o método não for crédito ou vale alimentação, mostrar pop-up
        if (bankAccounts.length === 0) {
          setShowAccountDialog(true);
        }
        
        setTransaction({
          ...transaction,
          paymentMethod: value,
          creditCardId: '', // Limpar cartão de crédito
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
                <div className="mt-2">
                  <CategorySelector 
                    categories={categories}
                    selectedCategoryId={transaction.categoryId}
                    onChange={(categoryId) => {
                      const category = categories.find(c => c.id === categoryId);
                      setTransaction({
                        ...transaction,
                        categoryId,
                        // Atualizar o tipo de transação baseado na categoria selecionada
                        type: category?.type || transaction.type
                      });
                    }}
                    filterByType={transaction.type}
                  />
                  
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
              {transaction.paymentMethod === 'CREDIT' ? (
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
                    {creditCards
                      .filter(card => card.cardType === 'CREDIT')
                      .map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.name} (Disponível: R$ {card.availableLimit.toFixed(2)})
                        </option>
                      ))}
                  </select>
                  {creditCards.filter(card => card.cardType === 'CREDIT').length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      Nenhum cartão de crédito cadastrado. Cadastre um cartão para utilizar esta opção.
                    </p>
                  )}
                  {creditCards.filter(card => card.cardType === 'CREDIT').length > 0 && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      O limite disponível será atualizado automaticamente após o registro desta transação
                    </p>
                  )}
                </div>
              ) : transaction.paymentMethod === 'DEBIT' && transaction.type === 'EXPENSE' ? (
                <div className="space-y-2">
                  {creditCards.filter(card => card.cardType === 'DEBIT').length > 0 ? (
                    <>
                      <label htmlFor="debitCardId" className="text-sm font-medium leading-none">
                        Cartão de Débito
                      </label>
                      <select
                        id="debitCardId"
                        name="creditCardId" // Usamos o mesmo campo de creditCardId para simplicidade
                        value={transaction.creditCardId || ''}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Selecione um cartão</option>
                        {creditCards
                          .filter(card => card.cardType === 'DEBIT')
                          .map((card) => (
                            <option key={card.id} value={card.id}>
                              {card.name}
                            </option>
                          ))}
                      </select>
                    </>
                  ) : (
                    <div>
                      <label htmlFor="bankAccountId" className="text-sm font-medium leading-none">
                        Conta Bancária
                      </label>
                      <select
                        id="bankAccountId"
                        name="bankAccountId"
                        value={transaction.bankAccountId || ''}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Selecione uma conta</option>
                        {bankAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name} (R$ {account.currentBalance.toFixed(2)})
                          </option>
                        ))}
                      </select>
                      {bankAccounts.length === 0 && (
                        <div className="flex items-center mt-1">
                          <p className="text-xs text-amber-500">
                            Nenhuma conta cadastrada. Cadastre uma conta bancária primeiro.
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
                  )}
                </div>
              ) : transaction.paymentMethod === 'FOOD_VOUCHER' ? (
                <div className="space-y-2">
                  <label htmlFor="foodVoucherId" className="text-sm font-medium leading-none">
                    Cartão Vale Alimentação
                  </label>
                  <select
                    id="foodVoucherId"
                    name="creditCardId" // Usamos o mesmo campo de creditCardId para simplicidade
                    value={transaction.creditCardId || ''}
                    onChange={handleChange}
                    required={transaction.paymentMethod === 'FOOD_VOUCHER'}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Selecione um cartão</option>
                    {creditCards
                      .filter(card => card.cardType === 'FOOD_VOUCHER')
                      .map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.name}
                        </option>
                      ))}
                  </select>
                  {creditCards.filter(card => card.cardType === 'FOOD_VOUCHER').length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      Nenhum cartão de vale alimentação cadastrado. Cadastre um primeiro.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="bankAccountId" className="text-sm font-medium leading-none">
                    {transaction.type === 'INCOME' ? 'Conta para Depósito' : 'Conta Bancária'}
                  </label>
                  <select
                    id="bankAccountId"
                    name="bankAccountId"
                    value={transaction.bankAccountId || ''}
                    onChange={handleChange}
                    required={transaction.type === 'INCOME'}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Selecione uma conta{transaction.type === 'INCOME' ? '' : ' (opcional)'}</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} (R$ {account.currentBalance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                  {bankAccounts.length === 0 && (
                    <div className="flex items-center mt-1">
                      <p className="text-xs text-red-500">
                        {transaction.type === 'INCOME' 
                          ? 'Você precisa cadastrar uma conta bancária para registrar receitas.' 
                          : 'Nenhuma conta cadastrada. A transação será registrada sem afetar saldos.'}
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
                  {transaction.type === 'INCOME' && bankAccounts.length > 0 && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      O saldo da conta será atualizado automaticamente após o registro
                    </p>
                  )}
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