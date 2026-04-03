import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAvatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
}

export function formatDate(date: any, locale: string = 'pt-BR'): string {
  if (!date) return 'Data não informada';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Data inválida';
    return d.toLocaleDateString(locale);
  } catch (e) {
    return 'Data inválida';
  }
}
