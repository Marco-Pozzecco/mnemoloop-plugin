import type { Snippet } from 'svelte';

export default interface CardProps {
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
