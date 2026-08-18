<script lang="ts">
	import { cn } from '../../../utils';
	import type TableThProps from './types';

	let { scope, className, children }: TableThProps = $props();
</script>

<th {scope} class={cn('ml-table__th', className)}>
	{@render children?.()}
</th>

<style lang="scss">
	@use 'tokens' as *;

	.ml-table__th {
		padding: $spacing-sm;
		text-align: left;
		font-size: $font-xs;
		font-weight: $font-semibold;
		text-transform: uppercase;
		color: $text-muted;
		border-bottom: 1px solid $background-modifier-border;
		vertical-align: middle;
		white-space: nowrap;
	}
</style>
