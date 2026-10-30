<script lang="ts">
	import { Chip } from '@/ui/components/elements';
	import type ManageDeckChipsProps from './types';

	let { decks, max = 2, className = '' }: ManageDeckChipsProps = $props();

	const visible = $derived(decks.slice(0, max));
	const hidden = $derived(decks.slice(max));
	const overflowCount = $derived(Math.max(0, decks.length - max));
</script>

{#if decks.length === 0}
	<span class="ml-deck-chips__empty">No decks</span>
{:else}
	<span
		class="ml-deck-chips {className}"
		title={overflowCount > 0 ? decks.join(', ') : undefined}
	>
		{#each visible as deck (deck)}
			<Chip variant="filled" size="sm">{deck}</Chip>
		{/each}
		{#if overflowCount > 0}
			<Chip variant="filled" size="sm" class="ml-deck-chips__overflow">
				+{overflowCount}
			</Chip>
			<!-- The fold is visual; assistive tech still gets every deck name. -->
			<span class="ml-visually-hidden">, also in {hidden.join(', ')}</span>
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

	/* A narrow column ellipsizes deck names; the hidden-deck count stays whole. */
	.ml-deck-chips :global(.ml-deck-chips__overflow) {
		flex: 0 0 auto;
	}

	.ml-deck-chips__empty {
		color: $text-muted;
		font-size: $font-sm;
	}
</style>
