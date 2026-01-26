/**
 * Props for the Input component
 */
export interface InputProps {
	/**
	 * Unique identifier for the input
	 */
	id?: string;

	/**
	 * Input type (e.g., text, number, email)
	 */
	type?: 'text' | 'number' | 'email' | 'password' | 'search';

	/**
	 * Label text for the input
	 */
	label?: string;

	/**
	 * Placeholder text
	 */
	placeholder?: string;

	/**
	 * Current value of the input
	 */
	value?: string | number;

	/**
	 * Whether the input is disabled
	 */
	disabled?: boolean;

	/**
	 * Whether the input is required
	 */
	required?: boolean;

	/**
	 * Whether the input has a validation error
	 */
	hasError?: boolean;

	/**
	 * Error message to display
	 */
	errorMessage?: string;

	/**
	 * Additional helper text
	 */
	helperText?: string;

	/**
	 * Optional max length for text inputs
	 */
	maxLength?: number;

	/**
	 * Optional min value for number inputs
	 */
	min?: number;

	/**
	 * Optional max value for number inputs
	 */
	max?: number;

	/**
	 * Additional CSS classes
	 */
	className?: string;

	/**
	 * Change event handler
	 */
	onChange?: (value: string) => void;

	/**
	 * Focus event handler
	 */
	onFocus?: () => void;

	/**
	 * Blur event handler
	 */
	onBlur?: () => void;

	/**
	 * Keydown event handler
	 */
	onKeydown?: (event: KeyboardEvent) => void;
}
