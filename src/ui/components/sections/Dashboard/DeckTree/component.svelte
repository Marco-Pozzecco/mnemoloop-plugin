<script lang="ts">
	import { Card, Icon } from '@/ui/components';
	import DeckTreeNode from '../DeckTreeNode/component.svelte';
	import type DeckTreeProps from './types';

	let { nodes, selectedDeck, onSelectDeck, onToggleExpand, className }: DeckTreeProps = $props();

	function handleSelectAll() {
		onSelectDeck(null);
	}

	function handleAllKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleSelectAll();
		}
	}

	let isAllSelected = $derived(selectedDeck === null);
</script>

<Card>
	<div class="ka-deck-tree {className}">
		<div
			class="ka-deck-tree__all-decks"
			class:ka-deck-tree__all-decks--selected={isAllSelected}
			onclick={handleSelectAll}
			role="button"
			tabindex="0"
			onkeydown={handleAllKeydown}
		>
			<Icon name="layers" size={16} />
			<span class="ka-deck-tree__all-decks-name">All Decks</span>
		</div>

		<div class="ka-deck-tree__nodes">
			{#each nodes as node (node.fullPath)}
				<DeckTreeNode {node} {selectedDeck} {onSelectDeck} {onToggleExpand} level={0} />
			{/each}
		</div>
	</div>
</Card>

<style>
	.ka-deck-tree {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: var(--font-ui-small);
	}

	.ka-deck-tree__all-decks {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.15s ease;
		font-weight: var(--font-medium);
		color: var(--text-normal);
	}

	.ka-deck-tree__all-decks:hover {
		background-color: var(--background-modifier-hover);
	}

	.ka-deck-tree__all-decks--selected {
		background-color: var(--background-modifier-active-hover);
	}

	.ka-deck-tree__all-decks-name {
		flex: 1;
	}

	.ka-deck-tree__nodes {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
</style>
