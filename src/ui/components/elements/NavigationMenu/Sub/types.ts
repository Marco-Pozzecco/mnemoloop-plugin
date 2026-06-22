import type { Snippet } from 'svelte';
import type { Orientation } from 'bits-ui';

export default interface NavigationMenuSubProps {
	value?: string;
	onValueChange?: (value: string) => void;
	orientation?: Orientation;
	className?: string;
	children?: Snippet;
}
