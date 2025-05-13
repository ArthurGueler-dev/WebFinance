'use client';

import React from 'react';

interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  type: 'INCOME' | 'EXPENSE';
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId: string;
  onChange: (categoryId: string) => void;
  filterByType?: 'INCOME' | 'EXPENSE' | null;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategoryId,
  onChange,
  filterByType = null
}) => {
  // Filtrar categorias pelo tipo, se necessário
  const filteredCategories = filterByType
    ? categories.filter(category => category.type === filterByType)
    : categories;

  // Agrupar categorias por tipo
  const expenseCategories = filteredCategories.filter(category => category.type === 'EXPENSE');
  const incomeCategories = filteredCategories.filter(category => category.type === 'INCOME');

  return (
    <div className="category-selector space-y-4">
      {/* Se não estiver filtrando por tipo, mostrar tabs para alternar entre tipos */}
      {!filterByType && filteredCategories.length > 0 && (
        <div className="flex border-b mb-3">
          <button 
            className={`px-4 py-2 text-sm font-medium ${
              expenseCategories.length > 0 ? "border-b-2 border-red-500 text-red-600" : ""
            }`}
            type="button"
          >
            Despesas ({expenseCategories.length})
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium ${
              incomeCategories.length > 0 ? "border-b-2 border-green-500 text-green-600" : ""
            }`}
            type="button"
          >
            Receitas ({incomeCategories.length})
          </button>
        </div>
      )}

      {/* Despesas */}
      {expenseCategories.length > 0 && (
        <div>
          {!filterByType && <h3 className="text-sm font-medium text-gray-500 mb-2">Despesas</h3>}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {expenseCategories.map((category) => (
              <div
                key={category.id}
                className={`p-3 rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                  selectedCategoryId === category.id 
                  ? 'bg-red-50 border-2 border-red-400 shadow-md dark:bg-red-900/20 dark:border-red-700' 
                  : 'border border-gray-200 hover:border-red-300 hover:shadow dark:border-gray-700 dark:hover:border-red-700'
                }`}
                onClick={() => onChange(category.id)}
              >
                <div className="flex flex-col items-center space-y-2 text-center">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.icon || '?'}
                  </div>
                  <span className="font-medium text-sm truncate w-full">
                    {category.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Receitas */}
      {incomeCategories.length > 0 && (
        <div>
          {!filterByType && <h3 className="text-sm font-medium text-gray-500 mb-2">Receitas</h3>}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {incomeCategories.map((category) => (
              <div
                key={category.id}
                className={`p-3 rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                  selectedCategoryId === category.id 
                  ? 'bg-green-50 border-2 border-green-400 shadow-md dark:bg-green-900/20 dark:border-green-700' 
                  : 'border border-gray-200 hover:border-green-300 hover:shadow dark:border-gray-700 dark:hover:border-green-700'
                }`}
                onClick={() => onChange(category.id)}
              >
                <div className="flex flex-col items-center space-y-2 text-center">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.icon || '?'}
                  </div>
                  <span className="font-medium text-sm truncate w-full">
                    {category.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredCategories.length === 0 && (
        <p className="text-center text-gray-500 py-4">
          Nenhuma categoria {filterByType?.toLowerCase()} disponível
        </p>
      )}
    </div>
  );
};

export default CategorySelector; 