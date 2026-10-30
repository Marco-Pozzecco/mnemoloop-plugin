export default interface ManageDeckChipsProps {
	/** Deck names on the card. */
	decks: string[];
	/** How many chips to show before folding the rest into a `+N` chip. */
	max?: number;
	className?: string;
}
