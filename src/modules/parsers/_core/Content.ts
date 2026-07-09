import { IContentParser } from '@/interfaces/parser/IContentParser';
import {
	ParseContentResult,
	ParseContentResultWithError,
	ParseContentResultWithSuccess,
} from '@/interfaces/parser/utils';
import { CardType } from '@/schemas';

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
}
