import { Tooltip } from 'layerchart';
import type { Snippet } from 'svelte';

export default interface TooltipProps extends Tooltip.TooltipProps {
	/** The tooltip text/content */
	content: string;
	/** Position relative to trigger */
	side?: 'top' | 'bottom' | 'left' | 'right';
	/** Alignment within the side */
	align?: 'start' | 'center' | 'end';
	/** Delay in ms before showing tooltip */
	delay?: number;
	/** Disable the tooltip */
	disabled?: boolean;
	/** Custom CSS class */
	className?: string;
	/** The trigger element */
	children?: Snippet;
}
