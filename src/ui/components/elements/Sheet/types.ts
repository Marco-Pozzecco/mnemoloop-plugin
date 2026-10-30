import type { Snippet } from 'svelte';

export default interface SheetProps {
	/** Accessible name and visible heading. */
	title: string;
	/** Accessible name for the close control. */
	closeLabel?: string;
	/** Close handler: wired to the close button and Escape. */
	onClose: () => void;
	/** Optional row under the title (badges, due date). */
	meta?: Snippet;
	/** Optional sticky footer. */
	footer?: Snippet;
	class?: string;
	children?: Snippet;
}
