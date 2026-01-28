import type { Snippet } from 'svelte';

export interface CardProps {
  title?: string;
  hasBorder?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  icon?: string;
  clickable?: boolean;
  className?: string;
  onclick?: () => void;
  children?: Snippet;
  footer?: Snippet;
}
