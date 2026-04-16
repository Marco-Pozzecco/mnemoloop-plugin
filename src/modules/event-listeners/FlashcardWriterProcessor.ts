import { IAdapter } from '@/interfaces/IAdapter';
import { IWriter } from '@/interfaces/IWriter';
import {
	DEFAULT_FLASHCARD_YAML,
	Flashcard,
	FlashcardContent,
	FlashcardYaml,
	PluginSettings,
} from '@/schemas';
import { EventData, EventType, FlashcardCreateRequestEvent } from '@/types/events';
import { Logger } from '@/utils/Logger';
import { Notice } from 'obsidian';
import { v4 as uuid } from 'uuid';
import { EventListener } from './EventListener';

export class FlashcardWriterProcess extends EventListener {
	private _writer: IWriter<Flashcard, FlashcardYaml, FlashcardContent>;
	private _settings: IAdapter<PluginSettings>;
	protected eventTypes: EventType[] = [EventType.FlashcardCreateRequest];

	constructor(
		writer: IWriter<Flashcard, FlashcardYaml, FlashcardContent>,
		settings: IAdapter<PluginSettings>,
	) {
		super();
		this._writer = writer;
		this._settings = settings;
	}

	dispose(): void {}

	protected process(event: EventData<unknown>): void {
		switch (event.event_type) {
			case EventType.FlashcardCreateRequest:
				this._handleFlashcardCreateRequest(event as FlashcardCreateRequestEvent);
				break;
		}
	}

	private _handleFlashcardCreateRequest(event: FlashcardCreateRequestEvent) {
		const { back, source, front } = event.data;

		const flashcard: Flashcard = {
			...DEFAULT_FLASHCARD_YAML,
			uuid: uuid(),
			source: `[[${source}]]`,
			back,
			front,
		};

		try {
			const flashcardPath = this._settings.data.flashcard.watch.directory + `/${flashcard.uuid}.md`;

			this._writer.create(flashcardPath, flashcard);

			new Notice('Flashcard created successfully');
			Logger.info(`Flashcard created: ${flashcard.uuid} from ${source}`);
		} catch (error) {
			Logger.error(`Failed to create flashcard ${flashcard.uuid}`, error);
			new Notice('Failed to create flashcard');
		}
	}
}
