import { TooltipContentPropsWithoutHTML } from 'bits-ui';
import type { Snippet } from 'svelte';

export default interface TooltipContentProps extends TooltipContentPropsWithoutHTML {
	side?: 'top' | 'bottom' | 'left' | 'right';
	sideOffset?: number;
	align?: 'start' | 'center' | 'end';
	alignOffset?: number;
	avoidCollisions?: boolean;
	collisionPadding?: number | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>;
	sticky?: 'partial' | 'always';
	hideWhenDetached?: boolean;
	strategy?: 'fixed' | 'absolute';
	forceMount?: boolean;
	class?: string;
	children?: Snippet;
}
