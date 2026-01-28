/**
 * Props for the Modal component
 */
export interface ModalProps {
	/**
	 * Whether the modal is open
	 */
	open?: boolean;

	/**
	 * Modal title
	 */
	title?: string;

	/**
	 * Maximum width of the modal
	 */
	maxWidth?: 'small' | 'medium' | 'large' | 'full';

	/**
	 * Whether to close on backdrop click
	 */
	closeOnBackdrop?: boolean;

	/**
	 * Whether to close on escape key
	 */
	closeOnEscape?: boolean;

	/**
	 * Whether to show close button
	 */
	showCloseButton?: boolean;

	/**
	 * Additional CSS classes
	 */
	className?: string;

	/**
	 * Close event handler
	 */
	onClose?: () => void;
}
