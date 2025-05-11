'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { TransactionType } from '@prisma/client';

interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
  icon: string;
}

const colorOptions = [
  '#FF5733', '#336BFF', '#33FF57', '#F033FF', '#FF3377', 
  '#33FFF0', '#FFD133', '#FF7733', '#888888', '#33FF33', 
  '#33DDFF', '#FF9900', '#9933FF', '#FFCC33', '#66CC33',
  '#FF8C33', '#3388FF', '#33A1FF', '#33FF81', '#33FFAA',
  '#FFD700', '#33D6FF', '#FF5533', '#FF3366', '#FF3355',
  '#FF3344', '#33FF44', '#33FFCC', '#33FFAA', '#FF99CC',
  '#FF33FF', '#CC33FF', '#AA33FF', '#8833FF', '#885533',
  '#774422', '#663311', '#552200', '#441100', '#88BB33',
  '#77AA22', '#777777', '#66FF66', '#FFAA00', '#FFBB00',
  '#FFCC00', '#FFDD00'
];

const iconOptions = [
  '🍔', '🚗', '🏠', '🎮', '💊', '📚', '👕', '📱', '💸',
  '💰', '💻', '📈', '🎁', '🔄', '💵', '🛒', '🍽️', '⛽',
  '🚌', '🔑', '🏢', '💡', '💧', '📡', '👨‍⚕️', '💉', '🏥',
  '🏋️', '📝', '📖', '💅', '✈️', '🎬', '📺', '🍻', '🏦',
  '💳', '🔒', '📊', '🐶', '🤝', '📦', '💹', '💲', '🏘️', '🏷️'
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  
  // Estado para o formulário
  const [formData, setFormData] = useState({
    name: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    color: colorOptions[0],
    icon: iconOptions[0],
  });

  // Buscar categorias ao montar o componente
  useEffect(() => {
    fetchCategories();
  }, []);

  // Buscar categorias do servidor
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Falha ao carregar categorias');
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as categorias',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Lidar com mudanças no formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Criar nova categoria
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao criar categoria');
      }
      
      await fetchCategories();
      setShowAddDialog(false);
      
      // Resetar formulário
      setFormData({
        name: '',
        type: 'EXPENSE',
        color: colorOptions[0],
        icon: iconOptions[0],
      });
      
      toast({
        title: 'Sucesso',
        description: 'Categoria criada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar categoria',
        variant: 'destructive'
      });
    }
  };

  // Editar categoria
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentCategory) return;
    
    try {
      const response = await fetch(`/api/categories/${currentCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar categoria');
      }
      
      await fetchCategories();
      setShowEditDialog(false);
      
      toast({
        title: 'Sucesso',
        description: 'Categoria atualizada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar categoria',
        variant: 'destructive'
      });
    }
  };

  // Excluir categoria
  const handleDeleteCategory = async () => {
    if (!currentCategory) return;
    
    try {
      const response = await fetch(`/api/categories/${currentCategory.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao excluir categoria');
      }
      
      await fetchCategories();
      setShowDeleteDialog(false);
      
      toast({
        title: 'Sucesso',
        description: 'Categoria excluída com sucesso',
      });
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir categoria',
        variant: 'destructive'
      });
    }
  };

  // Abrir modal de edição
  const openEditDialog = (category: Category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
    });
    setShowEditDialog(true);
  };

  // Abrir modal de exclusão
  const openDeleteDialog = (category: Category) => {
    setCurrentCategory(category);
    setShowDeleteDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">
            Gerencie suas categorias de transações
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          Nova Categoria
        </Button>
      </div>

      {/* Filtros e estatísticas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Estatísticas</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center border p-3 rounded-md">
              <span>Total de Categorias:</span>
              <span>{categories.length}</span>
            </div>
            <div className="flex justify-between items-center border p-3 rounded-md">
              <span>Categorias de Despesas:</span>
              <span>{categories.filter(c => c.type === 'EXPENSE').length}</span>
            </div>
            <div className="flex justify-between items-center border p-3 rounded-md">
              <span>Categorias de Receitas:</span>
              <span>{categories.filter(c => c.type === 'INCOME').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de categorias */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Despesas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <p>Carregando categorias...</p>
          ) : (
            categories
              .filter(category => category.type === 'EXPENSE')
              .map(category => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 rounded-md border"
                  style={{ borderLeftWidth: '4px', borderLeftColor: category.color }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-md flex items-center justify-center" style={{ backgroundColor: category.color }}>
                      <span className="text-white text-lg">{category.icon}</span>
                    </div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(category)}>
                      Excluir
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Receitas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <p>Carregando categorias...</p>
          ) : (
            categories
              .filter(category => category.type === 'INCOME')
              .map(category => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 rounded-md border"
                  style={{ borderLeftWidth: '4px', borderLeftColor: category.color }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-md flex items-center justify-center" style={{ backgroundColor: category.color }}>
                      <span className="text-white text-lg">{category.icon}</span>
                    </div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(category)}>
                      Excluir
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Modal para adicionar categoria */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nome
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                Tipo
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="EXPENSE">Despesa</option>
                <option value="INCOME">Receita</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="color" className="text-sm font-medium">
                Cor
              </label>
              <div className="grid grid-cols-8 gap-2">
                {colorOptions.map((color) => (
                  <div
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`h-8 w-8 rounded-full cursor-pointer border-2 ${
                      formData.color === color ? 'border-black dark:border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="icon" className="text-sm font-medium">
                Ícone
              </label>
              <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {iconOptions.map((icon) => (
                  <div
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`h-8 w-8 flex items-center justify-center rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      formData.icon === icon ? 'bg-gray-200 dark:bg-gray-700' : ''
                    }`}
                  >
                    {icon}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">Criar Categoria</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para editar categoria */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateCategory} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-medium">
                Nome
              </label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-type" className="text-sm font-medium">
                Tipo
              </label>
              <select
                id="edit-type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="EXPENSE">Despesa</option>
                <option value="INCOME">Receita</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-color" className="text-sm font-medium">
                Cor
              </label>
              <div className="grid grid-cols-8 gap-2">
                {colorOptions.map((color) => (
                  <div
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`h-8 w-8 rounded-full cursor-pointer border-2 ${
                      formData.color === color ? 'border-black dark:border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-icon" className="text-sm font-medium">
                Ícone
              </label>
              <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {iconOptions.map((icon) => (
                  <div
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`h-8 w-8 flex items-center justify-center rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      formData.icon === icon ? 'bg-gray-200 dark:bg-gray-700' : ''
                    }`}
                  >
                    {icon}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para excluir categoria */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Categoria</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a categoria "{currentCategory?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 