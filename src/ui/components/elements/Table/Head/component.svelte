<script lang="ts">
	import { cn } from '../../../utils';
	import type TableHeadProps from './types';

	let { className, children }: TableHeadProps = $props();
</script>

<thead class={cn('ml-table__head', className)}>
	{@render children?.()}
</thead>

<style lang="scss">
	@use 'tokens' as *;

	.ml-table__head {
		background-color: $background-modifier-hover;
	}
</style>
