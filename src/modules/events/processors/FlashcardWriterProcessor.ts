import { IAdapter } from '@/interfaces/IAdapter';
import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { IWriter } from '@/interfaces/IWriter';
import {
	DEFAULT_FLASHCARD_YAML,
	Flashcard,
	FlashcardContent,
	FlashcardYaml,
	PluginSettings,
} from '@/schemas';
import { ProcessorKey } from '@/types/processors';
import { Logger } from '@/utils/Logger';
import { Notice } from 'obsidian';
import { v4 as uuid } from 'uuid';
import { EventBus } from '../core/EventBus';
import { EventProcessor } from '../core/EventProcessor';
import { EventRegistry } from '../core/EventRegistry';
import {
	FlashcardReviewSessionScoreEvent,
	FlashcardWriterCreateRequestEvent,
	FlashcardWriterCreateResponseEvent,
	FlashcardWriterFmRequestEvent,
} from '../domains';
import { AdapterKey } from '@/types/adapters';
import { ParserKey } from '@/types/parsers';
import { FlashcardWriter } from '@/modules/writers/FlashcardWriter';
import { IEvent } from '@/interfaces/IEvent';

export class FlashcardWriterProcessor extends EventProcessor {
	protected readonly eventTypes: string[] = [
		FlashcardWriterCreateRequestEvent.type,
		FlashcardReviewSessionScoreEvent.type,
		FlashcardWriterFmRequestEvent.type,
	];

	private readonly _writer: IWriter<Flashcard, FlashcardYaml, FlashcardContent>;
	private readonly _settings: IAdapter<PluginSettings>;

	static {
		EventRegistry.instance.register(
			ProcessorKey.flashcardWriter,
			(deps: IEventRegistryDependencies) => {
				const settings = deps.adapters.get(AdapterKey.settings);
				if (!settings) {
					throw new Error('Settings adapter not found');
				}

				const parser = deps.parsers.get(ParserKey.flashcard);
				if (!parser) {
					throw new Error('Flashcard parser not found');
				}

				const writer = new FlashcardWriter(deps.plugin, parser);
				return new FlashcardWriterProcessor(writer, settings as IAdapter<PluginSettings>);
			},
		);
	}

	constructor(
		writer: IWriter<Flashcard, FlashcardYaml, FlashcardContent>,
		settings: IAdapter<PluginSettings>,
	) {
		super();
		this._writer = writer;
		this._settings = settings;
	}

	protected process(event: IEvent): void {
		if (event.isType(FlashcardReviewSessionScoreEvent.type)) {
			this._handleReview(event as FlashcardReviewSessionScoreEvent);
		} else if (event.isType(FlashcardWriterFmRequestEvent.type)) {
			this._handleFmRequest(event as FlashcardWriterFmRequestEvent);
		} else if (event.isType(FlashcardWriterCreateRequestEvent.type)) {
			this._handleCreate(event as FlashcardWriterCreateRequestEvent);
		}
	}

	private async _handleCreate(event: FlashcardWriterCreateRequestEvent): Promise<void> {
		const { front, back, source } = event.data;

		const flashcard: Flashcard = {
			...DEFAULT_FLASHCARD_YAML,
			uuid: uuid(),
			source: `[[${source}]]`,
			front,
			back,
		};

		try {
			const flashcardPath = this._settings.data.flashcard.watch.directory + `/${flashcard.uuid}.md`;

			await this._writer.create(flashcardPath, flashcard);

			new Notice('Flashcard created successfully');

			// Publish success event
			EventBus.instance.publish(
				new FlashcardWriterCreateResponseEvent({
					uuid: flashcard.uuid,
					filepath: flashcardPath,
					source: source ?? '',
					request_id: event.id,
				}),
			);
		} catch (error) {
			Logger.error(`Failed to create flashcard ${flashcard.uuid}`, error);
			new Notice('Failed to create flashcard');
		}
	}

	private async _handleReview(event: FlashcardReviewSessionScoreEvent): Promise<void> {
		const { filepath, ...fm } = event.data;
		this._writer.updateFrontmatter(filepath, fm);
	}

	private async _handleFmRequest(event: FlashcardWriterFmRequestEvent): Promise<void> {
		const { filepath, fm } = event.data;
		this._writer.updateFrontmatter(filepath, fm);
	}
}
