import type { Flashcard } from '@/schemas';

/** Shared props for per-type content components. */
export interface FlashcardContentProps<T> extends Omit<FlashcardContentRouterProps, 'flashcard'> {
	content: T;
}

/** Props for the root content router component. */
export default interface FlashcardContentRouterProps {
	flashcard: Flashcard | null;
	isAnswerShowing: boolean;
	onShowAnswer?: () => void;
	onSetAnswerCorrectness?: (isCorrect: boolean) => void;
	onAllRevealed?: () => void;
}
