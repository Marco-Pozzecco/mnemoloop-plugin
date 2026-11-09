import { CardStatus, CardType } from '@/schemas';
import type { Flashcard } from '@/schemas';
import { Form } from '@/ui/forms/Form.svelte';
import { FlashcardFormSchema } from './schema';
import type {
	FlashcardFormContentApi,
	FlashcardFormMode,
	FlashcardFormShellModel,
	FlashcardFormValues,
	FlashcardFormWriteResult,
	FlashcardFormWriter,
} from './types';

const FORM_NOT_READY = 'The form is not ready. Try again.';

/**
 * The flashcard form's state. It composes the schema-backed `Form` for the
 * fields it owns directly and adds the card-type editor and deck operations.
 */
export class FlashcardFormModel implements FlashcardFormShellModel {
	readonly mode: FlashcardFormMode;
	readonly card?: Flashcard;
	selectedType = $state<CardType>(CardType.Basic);
	contentApi = $state<FlashcardFormContentApi | null>(null);

	private readonly _form: Form<typeof FlashcardFormSchema>;

	constructor(mode: FlashcardFormMode, card?: Flashcard, prefillSource?: string) {
		this.mode = mode;
		this.card = mode === 'edit' ? card : undefined;

		const editing = mode === 'edit' ? card : undefined;
		this._form = new Form(FlashcardFormSchema, {
			decks: editing ? [...editing.decks] : [],
			source: editing ? (editing.source ?? '') : (prefillSource ?? ''),
			status: editing ? editing.status : CardStatus.ACTIVE,
		});
		this.selectedType = editing?.card_type ?? CardType.Basic;
	}

	get values(): FlashcardFormValues {
		return this._form.values;
	}

	get errors(): Record<string, string> {
		return this._form.errors;
	}

	get error(): string | null {
		return this._form.error;
	}

	get isSubmitting(): boolean {
		return this._form.isSubmitting;
	}

	setType(value: string): void {
		if (this.mode === 'edit') return;
		this.selectedType = value as CardType;
		// The router remounts on type change and registers a fresh editor.
		this.contentApi = null;
		this._form.clearError('content');
	}

	registerContent(api: FlashcardFormContentApi): void {
		this.contentApi = api;
	}

	addDeck(deck: string): void {
		const trimmed = deck.trim();
		if (!trimmed) return;
		if (this.values.decks.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return;
		this._form.setValue('decks', [...this.values.decks, trimmed]);
	}

	removeDeck(deck: string): void {
		this._form.setValue(
			'decks',
			this.values.decks.filter((item) => item.toLowerCase() !== deck.toLowerCase()),
		);
	}

	setSource(value: string): void {
		this._form.setValue('source', value);
	}

	setStatus(value: string): void {
		this._form.setValue('status', value as CardStatus);
	}

	async submit(write: FlashcardFormWriter): Promise<FlashcardFormWriteResult | null> {
		const contentApi = this.contentApi;
		if (!contentApi) {
			this._form.setError('content', FORM_NOT_READY);
			return null;
		}

		const contentError = contentApi.validate();
		if (contentError) {
			this._form.setError('content', contentError);
			return null;
		}
		this._form.clearError('content');

		const payload = {
			content: contentApi.buildContent(),
			decks: this.values.decks.filter((deck) => deck.trim() !== ''),
			source: this.values.source.trim() || null,
			status: this.mode === 'edit' ? this.values.status : undefined,
		};

		return this._form.submit(async () => {
			try {
				const result = await write(payload);
				if (!result.success) {
					this._form.setError('form', this.failureMessage);
				}
				return result;
			} catch (error) {
				this._form.setError(
					'form',
					error instanceof Error ? error.message : this.failureMessage,
				);
				return { success: false };
			}
		});
	}

	private get failureMessage(): string {
		return this.mode === 'create'
			? 'Couldn’t create the card. The vault rejected the write.'
			: 'Couldn’t save the card. The vault rejected the write.';
	}
}
