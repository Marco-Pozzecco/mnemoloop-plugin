import { IAdapter } from '@/interfaces/IAdapter';
import { ParseContentResult } from '@/interfaces/parser/utils';
import { CardType, FlashcardSequenceContent, FlashcardSequenceContentSchema } from '@/schemas';
import { PluginSettings } from '@/schemas/settings';
import { ContentParser } from '../_core/Content';

export class FlashcardSequenceContentParser extends ContentParser<FlashcardSequenceContent> {
	readonly cardType = CardType.Sequence;
	private _flashcardSettings: PluginSettings['flashcard'];

	constructor(settings: IAdapter<PluginSettings>) {
		super();
		this._flashcardSettings = settings.data.flashcard;
	}

	parse = (body: string): ParseContentResult<FlashcardSequenceContent> => {
		try {
			const { before: question, after } = this.splitAtMarker(body, this._flashcardSettings.marker);
			const steps = this.extractSteps(after);

			const result = FlashcardSequenceContentSchema.parse({
				meta_type: this.cardType,
				steps,
				question,
			});

			return this.parseContentResultSuccess(result);
		} catch (error) {
			return this.parseContentResultError(
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	};

	serialize = (content: FlashcardSequenceContent): ParseContentResult<string> => {
		let result = '';

		result += content.question + '\n\n';
		result += this._flashcardSettings.marker + '\n\n';
		result += content.steps.map((step) => `- ${step}`).join('\n');

		return this.parseContentResultSuccess(result);
	};

	private extractSteps(contentAfterMarker: string): FlashcardSequenceContent['steps'] {
		const lines = contentAfterMarker.split('\n');
		const listItemRegex = /^\s*(?:\d+[.)]\s+|[-*+]\s+)(.+)/;
		const items: string[] = [];

		for (const line of lines) {
			const match = listItemRegex.exec(line);
			if (match && match[1]) {
				items.push(match[1].trim());
			}
		}

		if (items.length < 2) {
			throw new Error('Sequence requires at least 2 steps');
		}

		return items;
	}
}
