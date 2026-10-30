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
		height: $table-head-height;
		padding: 0 $spacing-md;
		text-align: left;
		font-size: $font-xs;
		font-weight: $font-semibold;
		letter-spacing: $letter-spacing-caps;
		text-transform: uppercase;
		color: $text-muted;
		border-bottom: 1px solid $line-subtle;
		vertical-align: middle;
		white-space: nowrap;
	}
</style>
