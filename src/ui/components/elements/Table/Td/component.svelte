<script lang="ts">
	import { cn } from '../../../utils';
	import type TableTdProps from './types';

	let { colspan, rowspan, className, children }: TableTdProps = $props();
</script>

<td {colspan} {rowspan} class={cn('ml-table__td', className)}>
	{@render children?.()}
</td>

<style lang="scss">
	@use 'tokens' as *;

	.ml-table__td {
		padding: $spacing-sm;
		text-align: left;
		border-bottom: 1px solid $background-modifier-border;
		vertical-align: middle;
	}
</style>
