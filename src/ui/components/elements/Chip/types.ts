import type { Snippet } from 'svelte';
import type { Size } from '../utils';

export default interface ComboboxChipProps {
	/** Surface treatment: a filled tag or an outlined pill. */
	variant?: 'filled' | 'outline';
	/** Corner radius: `rounded` is 4px, `pill` is fully rounded. */
  shape?: 'rounded' | 'pill';
  size?: Extract<Size, "sm" | "md" | "lg">;
	class?: string;
	children?: Snippet;
	onDelete?: (event: MouseEvent) => void;
	/** Accessible name for the icon-only remove button. */
	removeLabel?: string;
	icon?: string;
}
