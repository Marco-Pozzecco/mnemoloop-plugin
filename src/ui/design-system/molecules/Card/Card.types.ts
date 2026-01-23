/**
 * Props for the Card component
 */
export interface CardProps {
	/**
	 * Optional card title
	 */
	title?: string;

	/**
	 * Whether the card has a border
	 */
	hasBorder?: boolean;

	/**
	 * Card padding variant
	 */
	padding?: 'none' | 'small' | 'medium' | 'large';

	/**
	 * Optional card icon
	 */
	icon?: string;

	/**
	 * Whether the card is clickable
	 */
	clickable?: boolean;

	/**
	 * Additional CSS classes
	 */
	className?: string;

	/**
	 * Click event handler (when clickable)
	 */
	onClick?: () => void;
}
