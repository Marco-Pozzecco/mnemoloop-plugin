import { IContentParser } from '@/interfaces/parser/IContentParser';
import {
	ParseContentResult,
	ParseContentResultWithError,
	ParseContentResultWithSuccess,
} from '@/interfaces/parser/utils';
import { CardType } from '@/schemas';
import { IAdapter } from '@/interfaces/IAdapter';
import { PluginSettings } from '@/schemas/settings';
import { ERROR_MESSAGES } from '@/utils/constants';

export abstract class ContentParser<Entity> implements IContentParser<Entity> {
	abstract cardType: CardType;
	abstract parse: (body: string) => ParseContentResult<Entity>;
	abstract serialize: (content: Entity) => ParseContentResult<string>;

	protected parseContentResultSuccess = <T>(entity: T): ParseContentResultWithSuccess<T> => {
		return { entity, success: true };
	};

	protected parseContentResultError = (error: Error): ParseContentResultWithError => {
		return { entity: null, success: false, error };
	};

	protected splitAtMarker(
		content: string,
		settings: IAdapter<PluginSettings>,
	): { before: string; after: string } {
		const marker = settings.data.flashcard.marker;
		const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const markerRegex = new RegExp(`\\n\\s*${escapedMarker}\\s*\\n`);
		const match = markerRegex.exec(content);
		if (!match || match.index === undefined) {
			throw new Error(ERROR_MESSAGES.MISSING_MARKER);
		}
		const frontEnd = match.index;
		const backStart = frontEnd + match.reduce((acc, curr) => (acc += curr.length), 0);
		const before = content.substring(0, frontEnd).trim();
		const after = content.substring(backStart).trim();
		return { before, after };
	}
}
