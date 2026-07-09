import { IAdapter } from '@/interfaces/IAdapter';
import { ParseContentResult } from '@/interfaces/parser/utils';
import { CardType, FlashcardBaseContent } from '@/schemas';
import { PluginSettings } from '@/schemas/settings';
import { ERROR_MESSAGES } from '@/utils/constants';
import { ContentParser } from '../_core/Content';

export class FlashcardBasicContentParser extends ContentParser<FlashcardBaseContent> {
	readonly cardType = CardType.Basic;
	private _settings: IAdapter<PluginSettings>;

	constructor(settings: IAdapter<PluginSettings>) {
		super();
		this._settings = settings;
	}

	parse = (body: string): ParseContentResult<FlashcardBaseContent> => {
		try {
			const { front, back } = this.splitContent(body);

			if (front === null || back === null) {
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
		return this.parseContentResultSuccess(`${content.front}\n\n${content.back}`);
	};

	/**
	 * Splits the body content into front and back parts using the configured marker.
	 */
	private splitContent(content: string): { front: string | null; back: string | null } {
		const marker = this._settings.data.flashcard.marker;

		// Escape special regex characters in the marker
		const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		// Use regex to find marker on its own line
		const markerRegex = new RegExp(`\\n\\s*${escapedMarker}\\s*\\n`);

		const match = markerRegex.exec(content);

		if (!match || match.index === undefined) {
			throw new Error(ERROR_MESSAGES.MISSING_MARKER);
		}

		const frontEnd = match.index;
		const backStart = frontEnd + match.reduce((acc, curr) => (acc += curr.length), 0);

		const front = content.substring(0, frontEnd).trim();
		const back = content.substring(backStart).trim();

		return {
			front: front.length > 0 ? front : null,
			back: back.length > 0 ? back : null,
		};
	}
}
