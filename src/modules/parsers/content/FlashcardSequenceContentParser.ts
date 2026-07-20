import { IAdapter } from '@/interfaces/IAdapter';
import { ParseContentResult } from '@/interfaces/parser/utils';
import { CardType, FlashcardSequenceContent, FlashcardSequenceContentSchema } from '@/schemas';
import { PluginSettings } from '@/schemas/settings';
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
			const after = this.splitAtMarker(body, this._settings).after;
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
