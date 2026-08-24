import { IAdapter } from '@/interfaces/IAdapter';
import { ParseContentResult } from '@/interfaces/parser/utils';
import { CardType, FlashcardQuizContent, FlashcardQuizContentSchema } from '@/schemas';
import { PluginSettings } from '@/schemas/settings';
import { ContentParser } from '../_core/Content';

export class FlashcardQuizContentParser extends ContentParser<FlashcardQuizContent> {
	readonly cardType = CardType.Quiz;
	private _flashcardSettings: PluginSettings['flashcard'];

	constructor(settings: IAdapter<PluginSettings>) {
		super();
		this._flashcardSettings = settings.data.flashcard;
	}

	parse = (body: string): ParseContentResult<FlashcardQuizContent> => {
		try {
			const { before, after } = this.splitAtMarker(body, this._flashcardSettings.marker);
			const { question, options, correct_index } = this.extractQuizData(before, after);

			const result = FlashcardQuizContentSchema.parse({
				meta_type: this.cardType,
				question,
				options,
				correct_index,
			});

			return this.parseContentResultSuccess(result);
		} catch (error) {
			return this.parseContentResultError(
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	};

	serialize = (content: FlashcardQuizContent): ParseContentResult<string> => {
		const marker = this._flashcardSettings.marker;
		const checkboxList = content.options
			.map((option, index) => {
				const prefix = index === content.correct_index ? '- [x] ' : '- [ ] ';
				return option
					.split('\n')
					.map((line, lineIndex) => `${lineIndex === 0 ? prefix : '  '}${line}`)
					.join('\n');
			})
			.join('\n');
		return this.parseContentResultSuccess(`${content.question}\n\n${marker}\n\n${checkboxList}`);
	};

	private extractQuizData(
		question: string,
		contentAfterMarker: string,
	): { question: string; options: string[]; correct_index: number } {
		const checkboxRegex = /^([ \t]*)[-*+][ \t]*\[([ xX])\][ \t]*(.*)$/;
		const options: string[] = [];
		let correct_index = -1;
		let listIndent: string | null = null;
		let currentOption: { checked: boolean; lines: string[] } | null = null;
		let pendingBlankLines = 0;

		const flushCurrentOption = () => {
			if (!currentOption) {
				return;
			}

			options.push(currentOption.lines.join('\n'));
			if (currentOption.checked) {
				if (correct_index !== -1) {
					throw new Error('Quiz requires exactly one checked option');
				}
				correct_index = options.length - 1;
			}
		};

		for (const line of contentAfterMarker.split('\n')) {
			const match = checkboxRegex.exec(line);
			if (match && match[3].trim().length > 0) {
				const indent = match[1];

				if (listIndent === null) {
					listIndent = indent;
				}

				if (indent === listIndent) {
					flushCurrentOption();
					currentOption = {
						checked: match[2].toLowerCase() === 'x',
						lines: [match[3]],
					};
					pendingBlankLines = 0;
					continue;
				}
			}

			if (currentOption && listIndent !== null) {
				const continuationPrefix = `${listIndent}  `;
				if (line.startsWith(continuationPrefix)) {
					while (pendingBlankLines > 0) {
						currentOption.lines.push('');
						pendingBlankLines--;
					}
					currentOption.lines.push(line.slice(continuationPrefix.length));
					continue;
				}

				if (line === '') {
					pendingBlankLines++;
					continue;
				}
			}

			pendingBlankLines = 0;
		}

		flushCurrentOption();

		if (correct_index === -1) {
			throw new Error('Quiz requires exactly one checked option');
		}

		if (options.length < 2) {
			throw new Error('Quiz requires at least 2 options');
		}

		return { question, options, correct_index };
	}
}
