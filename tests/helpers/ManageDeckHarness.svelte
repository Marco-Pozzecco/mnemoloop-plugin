<script lang="ts">
	import type { FlashcardMetadata } from '@/schemas';
	import ManageDeckCell from '@/ui/components/sections/Manage/Table/DeckCell/component.svelte';

	let {
		cards,
		deckOptions,
	}: { cards: FlashcardMetadata[]; deckOptions: string[] } = $props();

	const optionsDerived = $derived(deckOptions);

	// Mimics the Manage view: deck additions commit immediately against live card state.
	let cardsState = $state(cards);

	function addDeck(card: FlashcardMetadata, deck: string): void {
		const current = cardsState.find((c) => c.uuid === card.uuid);
		if (!current) return;
		const normalized = deck.trim();
		if (!normalized) return;
		if (current.decks.some((d) => d.toLowerCase() === normalized.toLowerCase())) return;
		cardsState = cardsState.map((c) =>
			c.uuid === card.uuid ? { ...c, decks: [...c.decks, normalized] } : c,
		);
	}

	function removeDeck(card: FlashcardMetadata, deck: string): void {
		const current = cardsState.find((c) => c.uuid === card.uuid);
		if (!current) return;
		const normalized = deck.trim();
		if (!normalized) return;
		cardsState = cardsState.map((c) =>
			c.uuid === card.uuid
				? { ...c, decks: c.decks.filter((d) => d.toLowerCase() !== normalized.toLowerCase()) }
				: c,
		);
	}
</script>

<!-- Desktop + hidden mobile presentation, like the real Manage table. -->
{#each cardsState as card (card.uuid)}
	<div class="desktop-row">
		<ManageDeckCell
			{card}
			deckOptions={optionsDerived}
			onAddDeck={(deck) => addDeck(card, deck)}
			onRemoveDeck={(deck) => removeDeck(card, deck)}
		/>
	</div>
	<div class="mobile-row" style="display:none">
		<ManageDeckCell
			{card}
			deckOptions={optionsDerived}
			onAddDeck={(deck) => addDeck(card, deck)}
			onRemoveDeck={(deck) => removeDeck(card, deck)}
		/>
	</div>
{/each}
