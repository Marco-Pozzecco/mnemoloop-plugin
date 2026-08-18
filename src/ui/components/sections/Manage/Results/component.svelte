<script lang="ts">
	import { Button, Table } from '@/ui/components/elements';
	import ManageLoadingState from '../LoadingState/component.svelte';
	import ManageTable from '../Table/component.svelte';
	import type ManageResultsProps from './types';

	let {
		isLoading,
		totalCount,
		visibleCount,
		cards,
		previews,
		deckOptions,
		onAddDeck,
		onRemoveDeck,
		onStatusChange,
		onEdit,
		onDelete,
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
		<ManageTable
			{cards}
			{previews}
			{deckOptions}
			{onAddDeck}
			{onRemoveDeck}
			{onStatusChange}
			{onEdit}
			{onDelete}
		/>
	{/if}
</div>
