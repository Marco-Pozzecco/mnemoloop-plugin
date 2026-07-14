import { IAdapter } from '@/interfaces/IAdapter';
import { ParseContentResult } from '@/interfaces/parser/utils';
import { CardType, FlashcardQuizContent, FlashcardQuizContentSchema } from '@/schemas';
import { PluginSettings } from '@/schemas/settings';
import { ERROR_MESSAGES } from '@/utils/constants';
import { ContentParser } from '../_core/Content';

export class FlashcardQuizContentParser extends ContentParser<FlashcardQuizContent> {
	readonly cardType = CardType.Quiz;
	private _settings: IAdapter<PluginSettings>;

	constructor(settings: IAdapter<PluginSettings>) {
		super();
		this._settings = settings;
	}

	parse = (body: string): ParseContentResult<FlashcardQuizContent> => {
		try {
			const after = this.splitContent(body);
			const { question, options, correct_index } = this.extractQuizData(body, after);

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
		const marker = this._settings.data.flashcard.marker;
		const checkboxList = content.options
			.map((opt, i) => (i === content.correct_index ? `- [x] ${opt}` : `- [ ] ${opt}`))
			.join('\n');
		return this.parseContentResultSuccess(`${content.question}\n${marker}\n${checkboxList}`);
	};

	private splitContent(content: string): string {
		const marker = this._settings.data.flashcard.marker;
		const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const markerRegex = new RegExp(`\\n\\s*${escapedMarker}\\s*\\n`);

		const match = markerRegex.exec(content);

		if (!match || match.index === undefined) {
			throw new Error(ERROR_MESSAGES.MISSING_MARKER);
		}

		const backStart = match.index + match.reduce((acc, curr) => (acc += curr.length), 0);

		return content.substring(backStart).trim();
	}

	private extractQuizData(
		fullBody: string,
		contentAfterMarker: string,
	): { question: string; options: string[]; correct_index: number } {
		const marker = this._settings.data.flashcard.marker;
		const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const markerRegex = new RegExp(`\\n\\s*${escapedMarker}\\s*\\n`);
		const match = markerRegex.exec(fullBody);

		const question = fullBody.substring(0, match!.index).trim();

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
