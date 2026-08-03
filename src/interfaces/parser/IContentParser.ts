import type { CardType } from '@/schemas/flashcard';
import { ParseContentResult } from './utils';

export interface IContentParser<TContent> {
	readonly cardType: CardType;
	/** Parse the body of a markdown file (after frontmatter has been extracted) into typed content. */
	parse: (body: string) => ParseContentResult<TContent>;
	/** Serialize the typed content back into a string. */
	serialize: (content: TContent) => ParseContentResult<string>;
}
