<script lang="ts">
	import DeckPicker from '@/ui/components/compositions/FlashcardForm/DeckPicker/component.svelte';

	let {
		initialDecks = [],
		deckOptions = [],
		onAdd,
		onRemove,
	}: {
		initialDecks?: string[];
		deckOptions?: string[];
		onAdd?: (deck: string) => void;
		onRemove?: (deck: string) => void;
	} = $props();

	let decks = $state<string[]>([...initialDecks]);

	function handleAdd(deck: string): void {
		if (!decks.includes(deck)) decks = [...decks, deck];
		onAdd?.(deck);
	}

	function handleRemove(deck: string): void {
		decks = decks.filter((item) => item !== deck);
		onRemove?.(deck);
	}
</script>

<DeckPicker {decks} {deckOptions} onAdd={handleAdd} onRemove={handleRemove} />
