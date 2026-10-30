<script lang="ts">
	import { Button, Table } from '@/ui/components/elements';
	import ManageCardList from '../CardList/component.svelte';
	import ManageLoadingState from '../LoadingState/component.svelte';
	import ManageTable from '../Table/component.svelte';
	import type ManageResultsProps from './types';

	let {
		cards,
		previews,
		hrefFor,
		selectedUuid = null,
		isLoading,
		totalCount,
		visibleCount,
		onOpen,
		onAdd,
		onReset,
		className,
	}: ManageResultsProps = $props();
</script>

<div class="ml-manage-results {className ?? ''}">
	{#if isLoading}
		<ManageLoadingState />
	{:else if totalCount === 0}
		<Table.EmptyState
			title="No flashcards yet"
			message="Click 'Add' to create your first flashcard."
		>
			{#snippet action()}
				<Button variant="primary" size="small" onclick={onAdd}>Add flashcard</Button>
			{/snippet}
		</Table.EmptyState>
	{:else if visibleCount === 0}
		<Table.EmptyState
			title="No cards match the current filters"
			message="Try adjusting or resetting your filters."
		>
			{#snippet action()}
				<Button variant="secondary" size="small" onclick={onReset}>Reset filters</Button>
			{/snippet}
		</Table.EmptyState>
	{:else}
		<div class="ml-manage-results__table">
			<ManageTable {cards} {previews} {hrefFor} {selectedUuid} {onOpen} />
		</div>
		<div class="ml-manage-results__cards">
			<ManageCardList {cards} {previews} {hrefFor} {onOpen} />
		</div>
	{/if}
</div>

<style lang="scss">
	@use 'tokens' as *;
	@use 'breakpoints' as *;

	.ml-manage-results {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.ml-manage-results__cards {
		display: none;
	}

	/* The table is the desktop presentation; cards take over at the tablet breakpoint. */
	@media (max-width: $tablet-breakpoint) {
		.ml-manage-results__table {
			display: none;
		}

		.ml-manage-results__cards {
			display: flex;
			flex-direction: column;
		}
	}
</style>
