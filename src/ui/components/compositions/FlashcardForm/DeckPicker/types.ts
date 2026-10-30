export default interface DeckPickerProps {
	/** Decks currently on the card. */
	decks: string[];
	/** Every deck in the vault, for suggestions. */
	deckOptions: string[];
	onAdd: (deck: string) => void;
	onRemove: (deck: string) => void;
	disabled?: boolean;
}
