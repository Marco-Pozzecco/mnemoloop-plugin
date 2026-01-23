/**
 * Props for the Toast component
 */
export interface ToastProps {
	/**
	 * Toast message to display
	 */
	message: string;

	/**
	 * Toast type/style
	 */
	type: 'info' | 'success' | 'warning' | 'error';

	/**
	 * Auto-dismiss duration in milliseconds (0 to disable)
	 */
	duration?: number;

	/**
	 * Whether the toast is visible
	 */
	visible?: boolean;

	/**
	 * Toast position
	 */
	position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

	/**
	 * Whether to show close button
	 */
	showCloseButton?: boolean;

	/**
	 * Optional icon to override default
	 */
	icon?: string;

	/**
	 * Additional CSS classes
	 */
	className?: string;

	/**
	 * Dismiss event handler
	 */
	onDismiss?: () => void;
}
