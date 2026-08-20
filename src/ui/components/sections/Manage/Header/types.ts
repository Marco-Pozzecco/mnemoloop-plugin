export default interface ManageHeaderProps {
	/** Total number of flashcards in the store (before filtering). */
	totalCount: number;
	/** Number of flashcards visible after filtering. */
	visibleCount: number;
	onAdd: () => void;
	className?: string;
}
