import type { Snippet } from 'svelte';

export interface ErrorWrapperProps {
  fallback: string;
  onRetry?: (() => void) | null;
  showError?: boolean;
  maxRetries?: number;
  className?: string;
  errorContext?: string;
  children?: Snippet;
}
