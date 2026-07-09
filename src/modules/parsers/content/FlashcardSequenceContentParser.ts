import { IAdapter } from '@/interfaces/IAdapter';
import { ParseContentResult } from '@/interfaces/parser/utils';
import { CardType, FlashcardSequenceContent, FlashcardSequenceContentSchema } from '@/schemas';
import { PluginSettings } from '@/schemas/settings';
import { ERROR_MESSAGES } from '@/utils/constants';
import { ContentParser } from '../_core/Content';

export class FlashcardSequenceContentParser extends ContentParser<FlashcardSequenceContent> {
	readonly cardType = CardType.Sequence;
	private _settings: IAdapter<PluginSettings>;

	constructor(settings: IAdapter<PluginSettings>) {
		super();
		this._settings = settings;
	}

	parse = (body: string): ParseContentResult<FlashcardSequenceContent> => {
		try {
			const after = this.splitContent(body);
			const steps = this.extractSteps(after);

			const result = FlashcardSequenceContentSchema.parse({ meta_type: this.cardType, steps });

			return this.parseContentResultSuccess(result);
		} catch (error) {
			return this.parseContentResultError(
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	};

	serialize = (content: FlashcardSequenceContent): ParseContentResult<string> => {
		return this.parseContentResultSuccess(content.steps.join('\n'));
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
