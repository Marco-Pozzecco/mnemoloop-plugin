<script lang="ts">
	import { cn } from '../../../utils';
	import type TableEmptyStateProps from './types';

	let { title, message = '', className, action }: TableEmptyStateProps = $props();
</script>

<div class={cn('ml-table-empty', className)}>
	<p class="ml-table-empty__title">{title}</p>
	{#if message}
		<p class="ml-table-empty__message">{message}</p>
	{/if}
	{#if action}
		<div class="ml-table-empty__action">
			{@render action()}
		</div>
	{/if}
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-table-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: $spacing-xxs;
		padding: $spacing-xl $spacing-sm;
		text-align: center;
		border: 1px solid $line-strong;
		border-radius: $radius-md;
	}

	.ml-table-empty__title {
		margin: 0;
		font-size: $font-md;
		font-weight: $font-normal;
		color: $text-normal;
	}

	.ml-table-empty__message {
		margin: 0;
		font-size: $font-sm;
		color: $text-muted;
	}

	.ml-table-empty__action {
		margin-top: $spacing-xs;
	}
</style>
