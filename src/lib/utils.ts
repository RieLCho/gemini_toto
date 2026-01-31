import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getConfidenceColor(confidence?: number): string {
  if (!confidence) return 'bg-gray-500';
  if (confidence >= 80) return 'bg-green-500';
  if (confidence >= 60) return 'bg-yellow-500';
  return 'bg-orange-500';
}

export function getPredictionBadgeColor(pick: string): string {
  switch (pick) {
    case '승':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case '무':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case '패':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}
