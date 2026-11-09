import type { CardStatus, CardType, Flashcard, FlashcardContent } from '@/schemas';
import type { BuildContentFn, ValidateFn } from './Content/types';
import type { FlashcardFormValues } from './schema';

export type FlashcardFormMode = 'create' | 'edit';

export type { FlashcardFormValues };

export interface FlashcardFormSavePayload {
	content: FlashcardContent;
	decks: string[];
	source: string | null;
	/** Only sent in edit mode; a new card starts ACTIVE. */
	status?: CardStatus;
}

export interface FlashcardFormWriteResult {
	success: boolean;
}

export type FlashcardFormWriter = (
	payload: FlashcardFormSavePayload,
) => Promise<FlashcardFormWriteResult>;

export interface FlashcardFormContentApi {
	validate: ValidateFn;
	buildContent: BuildContentFn;
}

/**
 * The reactive state the form body reads and writes. It deliberately excludes
 * submit so the body cannot own the save path.
 */
export interface FlashcardFormViewModel {
	readonly mode: FlashcardFormMode;
	readonly card?: Flashcard;
	selectedType: CardType;
	contentApi: FlashcardFormContentApi | null;
	values: FlashcardFormValues;
	errors: Record<string, string>;
	error: string | null;
	isSubmitting: boolean;

	setType(value: string): void;
	registerContent(api: FlashcardFormContentApi): void;
	addDeck(deck: string): void;
	removeDeck(deck: string): void;
	setSource(value: string): void;
	setStatus(value: string): void;
}

/** The form model a surface shell uses; it can submit and therefore write. */
export interface FlashcardFormShellModel extends FlashcardFormViewModel {
	submit(write: FlashcardFormWriter): Promise<FlashcardFormWriteResult | null>;
}

/** The shared form body. It does not render a surface or a footer. */
export default interface FlashcardFormProps {
	form: FlashcardFormViewModel;
	/** Every deck in the vault, for suggestions. */
	deckOptions: string[];
	/** Keeps field ids stable for each surface and avoids duplicate ids. */
	idPrefix: string;
}
