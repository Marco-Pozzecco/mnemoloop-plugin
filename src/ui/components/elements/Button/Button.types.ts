/**
 * Props for the Button component
 */
export interface ButtonProps {
	/**
	 * Visual style variant of the button
	 */
	variant?: 'primary' | 'secondary' | 'danger';

	/**
	 * Size of the button
	 */
	size?: 'small' | 'medium' | 'large';

	/**
	 * Whether the button is disabled
	 */
	disabled?: boolean;

	/**
	 * Optional ARIA label for accessibility
	 */
	ariaLabel?: string;

	/**
	 * Button type attribute
	 */
	type?: 'button' | 'submit' | 'reset';

	/**
	 * Optional title attribute for tooltips
	 */
	title?: string;

	/**
	 * Additional CSS classes
	 */
	className?: string;

	/**
	 * Click event handler
	 */
	onClick?: (event: MouseEvent) => void;
}
