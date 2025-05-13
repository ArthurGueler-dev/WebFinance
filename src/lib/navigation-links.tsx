import {
  LayoutDashboard,
  CreditCard,
  Building,
  ArrowLeftRight,
  Clock,
  LineChart,
  Receipt,
  FileText,
  Settings,
  Target,
  BarChart3
} from 'lucide-react';

export const navigationLinks = [
  {
    title: 'Visão Geral',
    icon: LayoutDashboard,
    href: '/dashboard',
    color: 'text-sky-500'
  },
  {
    title: 'Contas Bancárias',
    icon: Building,
    href: '/dashboard/bank-accounts',
    color: 'text-emerald-500'
  },
  {
    title: 'Cartões de Crédito',
    icon: CreditCard,
    href: '/dashboard/credit-cards',
    color: 'text-violet-500'
  },
  {
    title: 'Transações',
    icon: ArrowLeftRight,
    href: '/dashboard/transactions',
    color: 'text-blue-500'
  },
  {
    title: 'Objetivos Financeiros',
    icon: Target,
    href: '/dashboard/financial-goals',
    color: 'text-amber-500'
  },
  {
    title: 'Orçamentos',
    icon: BarChart3,
    href: '/dashboard/budgets',
    color: 'text-green-500'
  },
  {
    title: 'Agendamentos',
    icon: Clock,
    href: '/dashboard/schedules',
    color: 'text-red-500'
  },
  {
    title: 'Relatórios',
    icon: LineChart,
    href: '/dashboard/reports',
    color: 'text-orange-500'
  },
  {
    title: 'Extrato',
    icon: Receipt,
    href: '/dashboard/statements',
    color: 'text-purple-500'
  },
  {
    title: 'Faturas',
    icon: FileText,
    href: '/dashboard/invoices',
    color: 'text-pink-500'
  },
  {
    title: 'Configurações',
    icon: Settings,
    href: '/dashboard/settings',
    color: 'text-gray-500'
  },
]; 