import type { Snippet } from 'svelte';
import type { Direction, Orientation } from 'bits-ui';

export default interface NavigationMenuRootProps {
	value?: string;
	onValueChange?: (value: string) => void;
	delayDuration?: number;
	skipDelayDuration?: number;
	dir?: Direction;
	orientation?: Orientation;
	className?: string;
	children?: Snippet;
}
