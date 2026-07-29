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
			.map((opt, i) => (i === content.correct_index ? `- [x] ${opt}` : `- [ ] ${opt}`))
			.join('\n');
		return this.parseContentResultSuccess(`${content.question}\n\n${marker}\n\n${checkboxList}`);
	};

	private extractQuizData(
		question: string,
		contentAfterMarker: string,
	): { question: string; options: string[]; correct_index: number } {
		const checkboxRegex = /^\s*[-*+]\s*\[([ xX])\]\s*(.+)/gm;
		const options: string[] = [];
		let correct_index = -1;

		let m: RegExpExecArray | null;
		while ((m = checkboxRegex.exec(contentAfterMarker)) !== null) {
			const isChecked = m[1].toLowerCase() === 'x';
			const text = m[2].trim();
			options.push(text);

			if (isChecked) {
				if (correct_index !== -1) {
					throw new Error('Quiz requires exactly one checked option');
				}
				correct_index = options.length - 1;
			}
		}

		if (correct_index === -1) {
			throw new Error('Quiz requires exactly one checked option');
		}

		if (options.length < 2) {
			throw new Error('Quiz requires at least 2 options');
		}

		return { question, options, correct_index };
	}
}
