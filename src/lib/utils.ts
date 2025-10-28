import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata uma data no formato brasileiro (dd/MM/yyyy) sem problemas de timezone
 * @param date - String no formato YYYY-MM-DD ou objeto Date
 * @returns String formatada no formato dd/MM/yyyy
 */
export function formatDateBR(date: string | Date | null | undefined): string {
  if (!date) return '';

  // Se for string no formato YYYY-MM-DD, faz parsing manual para evitar timezone
  if (typeof date === 'string') {
    const [year, month, day] = date.split('T')[0].split('-');
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  // Se for Date, usa toLocaleDateString
  return date.toLocaleDateString('pt-BR');
}

/**
 * Formata uma data e hora no formato brasileiro (dd/MM/yyyy HH:mm) sem problemas de timezone
 * @param date - String ISO ou objeto Date
 * @returns String formatada no formato dd/MM/yyyy HH:mm
 */
export function formatDateTimeBR(date: string | Date | null | undefined): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
