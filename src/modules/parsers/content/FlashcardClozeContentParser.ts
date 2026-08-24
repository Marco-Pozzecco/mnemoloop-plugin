import { IAdapter } from '@/interfaces/IAdapter';
import { ParseContentResult } from '@/interfaces/parser/utils';
import { CardType, FlashcardClozeContent } from '@/schemas';
import { PluginSettings } from '@/schemas/settings';
import { parseClozeContent } from '@/utils/cloze';
import { ContentParser } from '../_core/Content';

export class FlashcardClozeContentParser extends ContentParser<FlashcardClozeContent> {
	readonly cardType = CardType.Cloze;
	private _flashcardSettings: PluginSettings['flashcard'];

	constructor(settings: IAdapter<PluginSettings>) {
		super();
		this._flashcardSettings = settings.data.flashcard;
	}

	parse = (body: string): ParseContentResult<FlashcardClozeContent> => {
		try {
			return this.parseContentResultSuccess(parseClozeContent(body));
		} catch (error) {
			return this.parseContentResultError(
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	};

	serialize = (content: FlashcardClozeContent): ParseContentResult<string> => {
		// Build a position → cloze lookup for O(1) insertion during iteration
		const positionMap = new Map<number, { id: string; answer: string; hint: string | null }>();
		for (const del of content.deletions) {
			for (const pos of del.positions) {
				positionMap.set(pos, { id: del.id, answer: del.answer, hint: del.hint });
			}
		}

		// Iterate through text, inserting cloze patterns at marked positions
		let result = '';
		for (let i = 0; i < content.text.length; i++) {
			const cloze = positionMap.get(i);
			if (cloze) {
				result += this._formatCloze(cloze.id, cloze.answer, cloze.hint);
			}
			result += content.text[i];
		}

		// Handle a deletion positioned at the very end of the text
		const endCloze = positionMap.get(content.text.length);
		if (endCloze) {
			result += this._formatCloze(endCloze.id, endCloze.answer, endCloze.hint);
		}

		return this.parseContentResultSuccess(result);
	};

	private _formatCloze(id: string, answer: string, hint: string | null): string {
		if (hint !== null) {
			return `{{${id}::${answer}::${hint}}}`;
		}
		return `{{${id}::${answer}}}`;
	}
}
