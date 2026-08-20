<script lang="ts">
	import { cn } from '../../../utils';
	import type TableRowProps from './types';

	let { className, children }: TableRowProps = $props();
</script>

<tr class={cn('ml-table__row', className)}>
	{@render children?.()}
</tr>

<style lang="scss">
	@use 'tokens' as *;

	.ml-table__row {
		transition: background-color $transition-fast;
	}

	.ml-table__row:hover {
		background-color: $background-modifier-hover;
	}

	.ml-table__row:last-child :global(.ml-table__td) {
		border-bottom: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.ml-table__row {
			transition: none;
		}
	}
</style>
