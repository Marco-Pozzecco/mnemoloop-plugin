<script lang="ts">
	import { Skeleton } from '@/ui/components/elements';
	import type ManageLoadingStateProps from './types';

	let { className }: ManageLoadingStateProps = $props();
</script>

<div class="ml-manage-loading {className ?? ''}" role="status" aria-label="Loading flashcards">
	{#each [0, 1, 2, 3, 4] as row (row)}
		<div class="ml-manage-loading__row">
			<Skeleton width="100%" height="16px" />
		</div>
	{/each}
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-manage-loading {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		padding: $spacing-sm 0;
	}

	.ml-manage-loading__row {
		height: 32px;
	}
</style>
