import { IContentParser } from '@/interfaces/parser/IContentParser';
import { ParseContentResult } from '@/interfaces/parser/utils';
import {
	CardType,
	Flashcard,
	FlashcardContent,
	FlashcardContentSchema,
	FlashcardYaml,
	FlashcardYamlSchema,
} from '@/schemas';
import { Plugin } from 'obsidian';
import { EntityParser } from '../_core/Entity';
import { FlashcardYamlParser } from '../yaml/FlashcardYamlParser';

export class FlashcardParser extends EntityParser<Flashcard, FlashcardYaml, FlashcardContent> {
	protected _contentParsers: Map<CardType, IContentParser<FlashcardContent>>;

	constructor(
		plugin: Plugin,
		contentParsers: IContentParser<FlashcardContent>[],
		yamlEngine?: FlashcardYamlParser,
	) {
		super(plugin, yamlEngine ?? new FlashcardYamlParser(plugin));

		this._contentParsers = new Map(contentParsers.map((p) => [p.cardType, p]));
	}

	parseContent = (content: string): ParseContentResult<FlashcardContent> => {
		try {
			const { fm, body } = this._yaml.extractFmFromContent(content);
			const contentParser = this._contentParsers.get(fm.card_type);

			if (!contentParser) {
				return this.parseContentResultError(
					new Error(`no ContentParser registered for card_type: ${fm.card_type}`),
				);
			}

			return contentParser.parse(body);
		} catch (error) {
			return this.parseContentResultError(
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	};

	serializeContent = (content: FlashcardContent): ParseContentResult<string> => {
		try {
			const contentParser = this._contentParsers.get(content.meta_type);

			if (!contentParser) {
				return this.parseContentResultError(
					new Error(`no ContentParser registered for card_type: ${content.meta_type}`),
				);
			}

			return contentParser.serialize(content);
		} catch (error) {
			return this.parseContentResultError(
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	};

	protected extractYamlMetadata(entity: Flashcard): FlashcardYaml {
		return FlashcardYamlSchema.parse(entity);
	}

	protected extractContentMetadata(entity: Flashcard): FlashcardContent {
		return FlashcardContentSchema.parse(entity.content);
	}
}
