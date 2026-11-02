import { CardStatus, CardType } from '@/schemas';
import type { Flashcard, FlashcardContent } from '@/schemas';
import type {
	BuildContentFn,
	ValidateFn,
} from '@/ui/components/compositions/FlashcardForm/Content/types';
import { parseDeckList } from '@/utils/deck-utils';
import type { FlashcardFormMode } from './types';
import type { FlashcardWriteResult } from './utils';

export interface FlashcardFormPayload {
	content: FlashcardContent;
	decks: string[];
	source: string | null;
	/** Sent only in edit mode; a new card starts ACTIVE. */
	status?: CardStatus;
}

export type FlashcardFormWriter = (payload: FlashcardFormPayload) => Promise<FlashcardWriteResult>;

interface ContentApi {
	validate: ValidateFn;
	buildContent: BuildContentFn;
}

/**
 * The form's state, validation and submit path, independent of how the fields
 * are laid out. The panel shell owns presentation; this owns the rules.
 */
export class FlashcardFormModel {
	readonly mode: FlashcardFormMode;

	selectedType = $state<CardType>(CardType.Basic);
	decks = $state<string[]>([]);
	source = $state('');
	status = $state<CardStatus>(CardStatus.ACTIVE);
	error = $state<string | null>(null);
	isSaving = $state(false);
	contentApi = $state<ContentApi | null>(null);

	constructor(mode: FlashcardFormMode, card?: Flashcard, prefillSource?: string) {
		this.mode = mode;
		this.seed(card, prefillSource);
	}

	/** Seed the fields from the card (edit) or the note link (create). */
	seed(card?: Flashcard, prefillSource?: string): void {
		if (this.mode === 'edit' && card) {
			this.selectedType = card.card_type;
			this.decks = [...(card.decks ?? [])];
			this.source = card.source ?? '';
			this.status = card.status;
			this.error = null;
			this.contentApi = null;
			return;
		}

		if (this.mode === 'create') {
			this.source = prefillSource ?? '';
		}
	}

	setType(value: string): void {
		if (this.mode === 'edit') return;
		this.selectedType = value as CardType;
		// The router remounts on type change and registers a fresh editor.
		this.contentApi = null;
		this.error = null;
	}

	registerContent(api: ContentApi): void {
		this.contentApi = api;
	}

	setDecksFromInput(value: string): void {
		this.decks = parseDeckList(value);
		this.error = null;
	}

	setSource(value: string): void {
		this.source = value;
		this.error = null;
	}

	setStatus(value: string): void {
		this.status = value as CardStatus;
		this.error = null;
	}

	/**
	 * Validate, build the payload and hand it to the writer. The writer owns the
	 * request/response correlation; the caller owns what happens after success.
	 */
	async submit(write: FlashcardFormWriter): Promise<FlashcardWriteResult | null> {
		if (this.isSaving) return null;

		const contentApi = this.contentApi;
		if (!contentApi) {
			this.error = 'The form is not ready. Try again.';
			return null;
		}

		const contentError = contentApi.validate();
		if (contentError) {
			this.error = contentError;
			return null;
		}

		const sourceValue = this.source.trim();
		if (sourceValue && !/^\[\[.*\]\]$/.test(sourceValue)) {
			this.error = 'Source must be a [[wikilink]] or empty.';
			return null;
		}

		this.error = null;
		this.isSaving = true;

		try {
			const result = await write({
				content: contentApi.buildContent(),
				decks: this.decks.filter((deck) => deck.trim() !== ''),
				source: sourceValue || null,
				status: this.mode === 'edit' ? this.status : undefined,
			});
			this.isSaving = false;
			if (!result.success) {
				this.error = 'Couldn’t save the card. Try again.';
			}
			return result;
		} catch (error) {
			this.isSaving = false;
			this.error = error instanceof Error ? error.message : 'Couldn’t save the card. Try again.';
			return { success: false };
		}
	}
}
