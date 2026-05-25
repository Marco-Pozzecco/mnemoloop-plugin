<script lang="ts">
	import { Icon } from '@/ui/components';
	import type DeckTreeNodeProps from './types';
	import Self from './component.svelte';

	let { node, selectedDeck, onSelectDeck, onToggleExpand, level }: DeckTreeNodeProps = $props();

	let isSelected = $derived(selectedDeck?.fullPath === node.fullPath);
	let hasChildren = $derived(node.children.length > 0);
	function handleSelect() {
		onSelectDeck(node.fullPath);
	}

	function handleToggle(event: MouseEvent) {
		event.stopPropagation();
		onToggleExpand(node.fullPath);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleSelect();
		}
	}
</script>

<div
	class="ml-deck-tree-node"
	class:ml-deck-tree-node--selected={isSelected}
	style="--indent: {level * 8}px"
>
	<div
		class="ml-deck-tree-node__content"
		onclick={handleSelect}
		role="button"
		tabindex="0"
		onkeydown={handleKeydown}
	>
		{#if hasChildren}
			<button
				class="ml-deck-tree-node__chevron"
				onclick={handleToggle}
				type="button"
				aria-label={node.isExpanded ? 'Collapse' : 'Expand'}
			>
				<Icon name={node.isExpanded ? 'chevron-down' : 'chevron-right'} size={14} />
			</button>
		{:else}
			<span class="ml-deck-tree-node__spacer"></span>
		{/if}

		<span class="ml-deck-tree-node__name">{node.name}</span>

		{#if node.dueNow > 0}
			<span class="ml-deck-tree-node__badge">{node.dueNow}</span>
		{/if}
	</div>

	{#if hasChildren && node.isExpanded}
		<div class="ml-deck-tree-node__children">
			{#each node.children as child (child.fullPath)}
				<Self node={child} {selectedDeck} {onSelectDeck} {onToggleExpand} level={level + 1} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.ml-deck-tree-node__content {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 2px 8px;
		padding-left: var(--indent, 0px);
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.15s ease;
		min-height: 32px;
	}

	.ml-deck-tree-node__content:hover {
		background-color: var(--background-modifier-hover);
	}

	.ml-deck-tree-node--selected .ml-deck-tree-node__content {
		background-color: var(--background-modifier-active-hover);
	}

	.ml-deck-tree-node__chevron {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin: 0 2px;
		border: none;
		background: none;
		cursor: pointer;
		border-radius: 50%;
		width: 24px;
		height: 24px;
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.ml-deck-tree-node__chevron:hover {
		/*background-color: var(--background-modifier-hover);*/
		color: var(--text-normal);
	}

	.ml-deck-tree-node__spacer {
		width: 28px;
		flex-shrink: 0;
	}

	.ml-deck-tree-node__name {
		flex: 1;
		font-size: var(--font-ui-small);
		color: var(--text-normal);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.ml-deck-tree-node__badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 6px;
		border-radius: 10px;
		background-color: var(--interactive-accent);
		color: var(--text-on-accent);
		font-size: var(--font-ui-smaller);
		font-weight: var(--font-bold);
		flex-shrink: 0;
	}

	.ml-deck-tree-node__children {
		display: flex;
		flex-direction: column;
	}
</style>
