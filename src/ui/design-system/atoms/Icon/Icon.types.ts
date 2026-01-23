/**
 * Props for the Icon component
 */
export interface IconProps {
	/**
	 * The name of the Obsidian icon to display
	 */
	name: string;

	/**
	 * Optional size in pixels
	 */
	size?: number;

	/**
	 * Optional color (CSS color value)
	 */
	color?: string;

	/**
	 * Additional CSS classes
	 */
	className?: string;

	/**
	 * Whether to flip the icon horizontally
	 */
	flipHorizontal?: boolean;

	/**
	 * Whether to flip the icon vertically
	 */
	flipVertical?: boolean;

	/**
	 * Rotation in degrees
	 */
	rotation?: number;
}
