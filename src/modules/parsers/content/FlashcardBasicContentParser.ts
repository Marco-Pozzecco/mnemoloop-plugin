import { IAdapter } from '@/interfaces/IAdapter';
import { ParseContentResult } from '@/interfaces/parser/utils';
import { CardType, FlashcardBaseContent } from '@/schemas';
import { PluginSettings } from '@/schemas/settings';
import { ContentParser } from '../_core/Content';

export class FlashcardBasicContentParser extends ContentParser<FlashcardBaseContent> {
	readonly cardType = CardType.Basic;
	private _flashcardSettings: PluginSettings['flashcard'];

	constructor(settings: IAdapter<PluginSettings>) {
		super();
		this._flashcardSettings = settings.data.flashcard;
	}

	parse = (body: string): ParseContentResult<FlashcardBaseContent> => {
		try {
			const { before: front, after: back } = this.splitAtMarker(
				body,
				this._flashcardSettings.marker,
			);

			if (!front || !back) {
				throw new Error('no content found');
			}

			return this.parseContentResultSuccess({ meta_type: this.cardType, front, back });
		} catch (error) {
			return this.parseContentResultError(
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	};

	serialize = (content: FlashcardBaseContent): ParseContentResult<string> => {
		return this.parseContentResultSuccess(
			`${content.front}\n\n${this._flashcardSettings.marker}\n\n${content.back}`,
		);
	};
}
