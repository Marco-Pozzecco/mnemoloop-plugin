import type { Snippet } from 'svelte';
import type { Orientation } from 'bits-ui';

export default interface TabsRootProps {
	value?: string;
	onValueChange?: (value: string) => void;
	orientation?: Orientation;
	loop?: boolean;
	activationMode?: 'manual' | 'automatic';
	disabled?: boolean;
	className?: string;
	children?: Snippet;
}
