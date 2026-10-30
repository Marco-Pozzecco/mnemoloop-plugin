<script lang="ts">
	import { cn } from '../../../utils';
	import type TableRowProps from './types';

	let { selected = false, className, children }: TableRowProps = $props();
</script>

<tr class={cn('ml-table__row', { 'ml-table__row--selected': selected }, className)}>
	{@render children?.()}
</tr>

<style lang="scss">
	@use 'tokens' as *;

	.ml-table__row {
		position: relative;
		transition: background-color $transition-fast;
	}

	.ml-table__row:hover {
		background-color: $background-modifier-hover;
	}

	.ml-table__row.ml-table__row--selected {
		background-color: $background-modifier-hover;
	}

	.ml-table__row.ml-table__row--selected :global(.ml-table__td:first-child) {
		box-shadow: inset 2px 0 0 $interactive-accent;
	}

	.ml-table__row:last-child :global(.ml-table__td) {
		border-bottom: none;
	}

	/*
	 * The row's primary control is a real anchor inside one cell. It stretches
	 * over the row so the whole line is one link, while modifier-click keeps the
	 * native open-in-new-tab behaviour.
	 */
	:global(.ml-table__row-link) {
		display: block;
		min-width: 0;
		color: inherit;
		text-decoration: none;
	}

	:global(.ml-table__row-link::after) {
		content: '';
		position: absolute;
		inset: 0;
	}

	:global(.ml-table__row-link:focus-visible) {
		outline: none;
	}

	:global(.ml-table__row-link:focus-visible::after) {
		outline: 2px solid $interactive-accent;
		outline-offset: -2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.ml-table__row {
			transition: none;
		}
	}
</style>
