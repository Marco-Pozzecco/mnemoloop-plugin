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
		const steps = content.steps
			.map((step) =>
				step
					.split('\n')
					.map((line, index) => `${index === 0 ? '- ' : '  '}${line}`)
					.join('\n'),
			)
			.join('\n');
		const result = content.question + '\n\n' + this._flashcardSettings.marker + '\n\n' + steps;

		return this.parseContentResultSuccess(result);
	};

	private extractSteps(contentAfterMarker: string): FlashcardSequenceContent['steps'] {
		const lines = contentAfterMarker.split('\n');
		const listItemRegex = /^([ \t]*)(?:\d+[.)][ \t]+|[-*+][ \t]+)(.*)$/;
		const items: string[] = [];
		let listIndent: string | null = null;
		let currentItem: string[] | null = null;
		let pendingBlankLines = 0;

		const flushCurrentItem = () => {
			if (currentItem) {
				items.push(currentItem.join('\n'));
			}
		};

		for (const line of lines) {
			const match = listItemRegex.exec(line);
			if (match && match[2].trim().length > 0) {
				const indent = match[1];

				if (listIndent === null) {
					listIndent = indent;
				}

				if (indent === listIndent) {
					flushCurrentItem();
					currentItem = [match[2]];
					pendingBlankLines = 0;
					continue;
				}
			}

			if (currentItem && listIndent !== null) {
				const continuationPrefix = `${listIndent}  `;
				if (line.startsWith(continuationPrefix)) {
					while (pendingBlankLines > 0) {
						currentItem.push('');
						pendingBlankLines--;
					}
					currentItem.push(line.slice(continuationPrefix.length));
					continue;
				}

				if (line === '') {
					pendingBlankLines++;
					continue;
				}
			}

			pendingBlankLines = 0;
		}

		flushCurrentItem();

		if (items.length < 2) {
			throw new Error('Sequence requires at least 2 steps');
		}

		return items;
	}
}
