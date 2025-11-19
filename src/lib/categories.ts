import {
  UtensilsCrossed,
  ShoppingCart,
  Home,
  Car,
  Plane,
  Film,
  Heart,
  Gift,
  Zap,
  Wifi,
  ShoppingBag,
  Coffee,
  type LucideIcon,
} from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
}

export const categories: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: UtensilsCrossed, color: 'hsl(var(--chart-1))' },
  { id: 'groceries', name: 'Groceries', icon: ShoppingCart, color: 'hsl(var(--chart-2))' },
  { id: 'home', name: 'Home & Rent', icon: Home, color: 'hsl(var(--chart-3))' },
  { id: 'transport', name: 'Transport', icon: Car, color: 'hsl(var(--chart-4))' },
  { id: 'travel', name: 'Travel', icon: Plane, color: 'hsl(var(--chart-5))' },
  { id: 'entertainment', name: 'Entertainment', icon: Film, color: 'hsl(20 85% 60%)' },
  { id: 'healthcare', name: 'Healthcare', icon: Heart, color: 'hsl(0 72% 51%)' },
  { id: 'gifts', name: 'Gifts', icon: Gift, color: 'hsl(280 70% 60%)' },
  { id: 'utilities', name: 'Utilities', icon: Zap, color: 'hsl(45 90% 55%)' },
  { id: 'internet', name: 'Internet & Phone', icon: Wifi, color: 'hsl(187 85% 45%)' },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag, color: 'hsl(340 75% 55%)' },
  { id: 'coffee', name: 'Coffee & Snacks', icon: Coffee, color: 'hsl(25 75% 50%)' },
];

export function getCategoryById(id: string): Category | undefined {
  return categories.find(c => c.id === id);
}
