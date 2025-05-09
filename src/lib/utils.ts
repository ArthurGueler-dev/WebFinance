import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Função para formatar números de forma consistente
export function formatCurrency(value: number): string {
  // Usar um formato fixo que será igual tanto no cliente quanto no servidor
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
} 