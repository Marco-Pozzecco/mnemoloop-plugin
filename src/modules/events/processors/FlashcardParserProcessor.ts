import { IEvent } from '@/interfaces/IEvent';
import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { IParser } from '@/interfaces/IParser';
import { Flashcard, FlashcardYaml } from '@/schemas';
import { ParserKey } from '@/types/parsers';
import { ProcessorKey } from '@/types/processors';
import { EventBus } from '../core/EventBus';
import { EventProcessor } from '../core/EventProcessor';
import { EventRegistry } from '../core/EventRegistry';
import {
	FlashcardParserParseAllRequestEvent,
	FlashcardParserParseAllResponseEvent,
	FlashcardParserParseContentRequestEvent,
	FlashcardParserParseContentResponseEvent,
	FlashcardParserParseMetadataRequestEvent,
	FlashcardParserParseMetadataResponseEvent,
	FlashcardParserParseRequestEvent,
	FlashcardParserParseResponseEvent,
} from '../domains';

/**
 * Event processor for flashcard parsing operations.
 *
 * Listens to parser request events, executes the appropriate FlashcardParser
 * methods, and publishes response events with results or errors.
 *
 */
export class FlashcardParserProcessor extends EventProcessor {
	protected readonly eventTypes: string[] = [
		FlashcardParserParseRequestEvent.type,
		FlashcardParserParseContentRequestEvent.type,
		FlashcardParserParseMetadataRequestEvent.type,
		FlashcardParserParseAllRequestEvent.type,
	];

	private readonly _parser: IParser<Flashcard, FlashcardYaml>;

	static {
		EventRegistry.instance.register(
			ProcessorKey.flashcardParser,
			(deps: IEventRegistryDependencies) => {
				const parser = deps.parsers.get(ParserKey.flashcard);
				if (!parser) {
					throw new Error('Flashcard parser not found');
				}

				return new FlashcardParserProcessor(parser);
			},
		);
	}

	constructor(parser: IParser<Flashcard, FlashcardYaml>) {
		super();
		this._parser = parser;
	}

	/**
	 * Process incoming parser request events.
	 * Routes events to appropriate handlers based on event type.
	 *
	 * @param event The parser request event to process
	 */
	protected process(event: IEvent): void {
		if (event.isType(FlashcardParserParseRequestEvent.type)) {
			void this._handleParse(event as FlashcardParserParseRequestEvent);
		} else if (event.isType(FlashcardParserParseContentRequestEvent.type)) {
			void this._handleParseContent(event as FlashcardParserParseContentRequestEvent);
		} else if (event.isType(FlashcardParserParseMetadataRequestEvent.type)) {
			void this._handleParseMetadata(event as FlashcardParserParseMetadataRequestEvent);
		} else if (event.isType(FlashcardParserParseAllRequestEvent.type)) {
			void this._handleParseAll(event as FlashcardParserParseAllRequestEvent);
		}
	}

	private async _handleParse(event: FlashcardParserParseRequestEvent): Promise<void> {
		const { filepath } = event.data;

		const result = await this._parser.parse(filepath);

		EventBus.instance.publish(
			new FlashcardParserParseResponseEvent({
				entity: result.entity,
				filepath: result.filepath,
			}),
		);
	}

	private async _handleParseContent(event: FlashcardParserParseContentRequestEvent): Promise<void> {
		const { content } = event.data;

		const result = this._parser.parseContent(content);

		EventBus.instance.publish(
			new FlashcardParserParseContentResponseEvent({
				entity: result.entity,
			}),
		);
	}

	private async _handleParseMetadata(
		event: FlashcardParserParseMetadataRequestEvent,
	): Promise<void> {
		const { filepath } = event.data;

		const result = await this._parser.parseMetadata(filepath);

		EventBus.instance.publish(
			new FlashcardParserParseMetadataResponseEvent({
				entity: result.entity,
				filepath: result.filepath,
			}),
		);
	}

	private async _handleParseAll(event: FlashcardParserParseAllRequestEvent): Promise<void> {
		const { dirPath } = event.data;

		const results = await this._parser.parseAll(dirPath);

		EventBus.instance.publish(
			new FlashcardParserParseAllResponseEvent({
				entities: results.map((r) => ({
					entity: r.entity,
					filepath: r.filepath,
				})),
				dirPath,
			}),
		);
	}
}
