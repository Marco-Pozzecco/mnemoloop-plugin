<script lang="ts">
	import { Chip } from '@/ui/components/elements';
	import type ManageDeckChipsProps from './types';

	let { decks, max = 2, className = '' }: ManageDeckChipsProps = $props();

	const visible = $derived(decks.slice(0, max));
	const overflowCount = $derived(Math.max(0, decks.length - max));
</script>

{#if decks.length === 0}
	<span class="ml-deck-chips__empty">No decks</span>
{:else}
	<span class="ml-deck-chips {className}">
		{#each visible as deck (deck)}
			<Chip variant="filled" size="sm">{deck}</Chip>
		{/each}
		{#if overflowCount > 0}
			<Chip variant="filled" size="sm">+{overflowCount}</Chip>
		{/if}
	</span>
{/if}

<style lang="scss">
	@use 'tokens' as *;

	.ml-deck-chips {
		display: flex;
		align-items: center;
		gap: $spacing-xxs;
		min-width: 0;
		overflow: hidden;
	}

	.ml-deck-chips__empty {
		color: $text-muted;
		font-size: $font-sm;
	}
</style>
