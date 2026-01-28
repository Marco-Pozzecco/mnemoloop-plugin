export interface ErrorWrapperProps {
	/** Fallback UI message to display when error occurs */
	fallback: string;
	/** Optional retry callback function */
	onRetry?: (() => void) | null;
	/** Whether to show error notification/toast (default: true) */
	showError?: boolean;
	/** Maximum number of retries before giving up (default: 3) */
	maxRetries?: number;
	/** Custom CSS class for wrapper */
	className?: string;
	/** Additional context for error logging */
	errorContext?: string;
}
