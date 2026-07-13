import type { Flashcard } from '@/schemas';

/** Shared props for per-type content components. */
export interface FlashcardContentProps<T> {
	content: T;
	showingAnswer: boolean;
	/** Called by auto-scoring content components (e.g. Sequence) when correctness is determined. */
	onResult?: (isCorrect: boolean) => void;
}

/** Props for the root content router component. */
export default interface FlashcardContentRouterProps {
	flashcard?: Flashcard;
	showingAnswer: boolean;
	onResult?: (isCorrect: boolean) => void;
}
