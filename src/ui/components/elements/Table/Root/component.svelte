<script lang="ts">
	import { cn } from '../../../utils';
	import type TableRootProps from './types';

	let { caption, className, children }: TableRootProps = $props();
</script>

<table class={cn('ml-table', className)}>
	{#if caption}
		<caption class="ml-table__caption">{caption}</caption>
	{/if}
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

	.ml-table__caption {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
