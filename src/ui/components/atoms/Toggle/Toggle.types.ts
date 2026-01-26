/**
 * Props for the Toggle component
 */
export interface ToggleProps {
	/**
	 * Unique identifier for the toggle
	 */
	id?: string;

	/**
	 * Label text for the toggle
	 */
	label?: string;

	/**
	 * Whether the toggle is checked
	 */
	checked?: boolean;

	/**
	 * Whether the toggle is disabled
	 */
	disabled?: boolean;

	/**
	 * Optional helper text
	 */
	helperText?: string;

	/**
	 * Size of the toggle switch
	 */
	size?: 'small' | 'medium' | 'large';

	/**
	 * Additional CSS classes
	 */
	className?: string;

	/**
	 * Change event handler
	 */
	onChange?: (checked: boolean) => void;
}
