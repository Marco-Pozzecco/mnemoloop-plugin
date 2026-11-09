import type { CardStatus, Flashcard } from '@/schemas';

export default interface FlashcardFormMetaProps {
	/** The card being edited; the type and due date come from it. */
	card?: Flashcard;
	/** The live status, which the edit form can change. */
	status: CardStatus;
}
