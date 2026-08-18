<script lang="ts">
	import { cn } from '../../../utils';
	import type TableRootProps from './types';

	let { className, children }: TableRootProps = $props();
</script>

<table class={cn('ml-table', className)}>
	{@render children?.()}
</table>

<style lang="scss">
	@use 'tokens' as *;

	.ml-table {
		width: 100%;
		border-collapse: collapse;
		font-size: $font-sm;
		line-height: $line-height-normal;
	}
</style>
