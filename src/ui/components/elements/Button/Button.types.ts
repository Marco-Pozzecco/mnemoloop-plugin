import type { Snippet } from 'svelte';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  ariaLabel?: string;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  className?: string;
  onclick?: (event: MouseEvent) => void;
  children?: Snippet;
}
