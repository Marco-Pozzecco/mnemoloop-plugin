import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { SettingsAdapter } from '@/modules/adapters/SettingsAdapter';
import { DEFAULT_FLASHCARD_YAML, Flashcard } from '@/schemas';
import { AdapterKey } from '@/types/adapters';
import { WriterKey } from '@/types/writers';
import { Logger } from '@/utils/Logger';
import { Notice } from 'obsidian';
import { v4 as uuid } from 'uuid';
import { EventHandler } from '../../core/EventHandler';
import {
	FlashcardWriterBodyRequestEvent,
	FlashcardWriterBodyResponseEvent,
	FlashcardWriterCreateRequestEvent,
	FlashcardWriterCreateResponseEvent,
	FlashcardWriterDeleteRequestEvent,
	FlashcardWriterDeleteResponseEvent,
	FlashcardWriterFmRequestEvent,
	FlashcardWriterFmResponseEvent,
	FlashcardWriterUpdateRequestEvent,
	FlashcardWriterUpdateResponseEvent,
} from '../../domains/flashcard/writer';

export class FlashcardWriterCreateHandler extends EventHandler<FlashcardWriterCreateRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardWriterCreateRequestEvent): Promise<void> {
		const writer = this._writers.get(WriterKey.flashcard)!;
		const settings = this._adapters.get(AdapterKey.settings)! as SettingsAdapter;
		const { content, source, decks } = event.data;
		const flashcard = {
			...DEFAULT_FLASHCARD_YAML,
			uuid: uuid(),
			source: `[[${source}]]`,
			decks: decks ?? [],
			content,
			card_type: content.meta_type,
		} as Flashcard;
		const flashcardPath = settings.data.flashcard.watch.directory + `/${flashcard.uuid}.md`;

		await writer
			.create(flashcardPath, flashcard)
			.then(() => {
				new Notice('Flashcard created successfully');
				void this._bus.publish(new FlashcardWriterCreateResponseEvent({ filepath: flashcardPath }));
			})
			.catch((err) => {
				Logger.error('Failed to create flashcard', err);
				new Notice('Failed to create flashcard');
			});
	}
}

export class FlashcardWriterUpdateHandler extends EventHandler<FlashcardWriterUpdateRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardWriterUpdateRequestEvent): Promise<void> {
		const writer = this._writers.get(WriterKey.flashcard)!;
		const settings = this._adapters.get(AdapterKey.settings)! as SettingsAdapter;
		const filepath = settings.data.flashcard.watch.directory + `/${event.data.uuid}.md`;
		await writer.update(filepath, event.data).catch((err) => {
			Logger.error('WriterUpdateEventError:', err);
		});
		void this._bus.publish(new FlashcardWriterUpdateResponseEvent({ filepath }));
	}
}

export class FlashcardWriterDeleteHandler extends EventHandler<FlashcardWriterDeleteRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardWriterDeleteRequestEvent): Promise<void> {
		const writer = this._writers.get(WriterKey.flashcard)!;
		const settings = this._adapters.get(AdapterKey.settings)! as SettingsAdapter;
		const { uuid } = event.data;
		const filepath = settings.data.flashcard.watch.directory + `/${uuid}.md`;
		await writer.delete(filepath).catch((err) => {
			Logger.error('WriterUpdateEventError:', err);
		});
		void this._bus.publish(new FlashcardWriterDeleteResponseEvent({ filepath }));
	}
}

export class FlashcardWriterFmHandler extends EventHandler<FlashcardWriterFmRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardWriterFmRequestEvent): Promise<void> {
		const writer = this._writers.get(WriterKey.flashcard)!;
		const { filepath, fm } = event.data;
		await writer.updateFrontmatter(filepath, fm).catch((err) => {
			Logger.error('WriterUpdateEventError:', err);
		});
		void this._bus.publish(new FlashcardWriterFmResponseEvent({ filepath }));
	}
}

export class FlashcardWriterBodyHandler extends EventHandler<FlashcardWriterBodyRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}
	async handle(event: FlashcardWriterBodyRequestEvent): Promise<void> {
		const writer = this._writers.get(WriterKey.flashcard)!;
		const { content, filepath } = event.data;
		await writer.updateBody(filepath, content).catch((err) => {
			Logger.error('WriterUpdateEventError:', err);
		});
		void this._bus.publish(new FlashcardWriterBodyResponseEvent({ filepath }));
	}
}
