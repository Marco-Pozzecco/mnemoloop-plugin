<script lang="ts">
	import { cn } from '../../../utils';
	import type TableTdProps from './types';

	let { colspan, rowspan, class: className, children }: TableTdProps = $props();
</script>

<td {colspan} {rowspan} class={cn('ml-table__td', className)}>
	{@render children?.()}
</td>

<style lang="scss">
	@use 'tokens' as *;

	.ml-table__td {
		height: $row-height;
		padding: 0 $spacing-md;
		text-align: left;
		border-bottom: 1px solid $line-subtle;
		vertical-align: middle;
	}
</style>
