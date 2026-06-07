import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { SettingsAdapter } from '@/modules/adapters/SettingsAdapter';
import { FlashcardWriter } from '@/modules/writers/FlashcardWriter';
import { DEFAULT_FLASHCARD_YAML } from '@/schemas';
import { AdapterKey } from '@/types/adapters';
import { WriterKey } from '@/types/writers';
import { Logger } from '@/utils/Logger';
import { Notice } from 'obsidian';
import { v4 as uuid } from 'uuid';
import { EventHandler } from '../../core/EventHandler';
import {
	FlashcardWriterBodyEvent,
	FlashcardWriterCreateEvent,
	FlashcardWriterDeleteEvent,
	FlashcardWriterFmEvent,
	FlashcardWriterUpdateEvent,
} from '../../domains/flashcard/writer';

export class FlashcardWriterCreateHandler extends EventHandler<FlashcardWriterCreateEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardWriterCreateEvent): Promise<void> {
		const writer = this._writers.get(WriterKey.flashcard)! as FlashcardWriter;
		const settings = this._adapters.get(AdapterKey.settings)! as SettingsAdapter;
		const { front, back, source } = event.data;
		const flashcard = {
			...DEFAULT_FLASHCARD_YAML,
			uuid: uuid(),
			source: `[[${source}]]`,
			front,
			back,
		};
		const flashcardPath = settings.data.flashcard.watch.directory + `/${flashcard.uuid}.md`;

		try {
			await writer.create(flashcardPath, flashcard);
			new Notice('Flashcard created successfully');
		} catch (err) {
			Logger.error('Failed to create flashcard', err);
			new Notice('Failed to create flashcard');
		}
	}
}

export class FlashcardWriterUpdateHandler extends EventHandler<FlashcardWriterUpdateEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardWriterUpdateEvent): Promise<void> {
		const writer = this._writers.get(WriterKey.flashcard)! as FlashcardWriter;
		const settings = this._adapters.get(AdapterKey.settings)! as SettingsAdapter;
		const { uuid, front, back, source } = event.data;
		const flashcard = { ...DEFAULT_FLASHCARD_YAML, uuid, source, front, back };
		const filepath = settings.data.flashcard.watch.directory + `/${uuid}.md`;
		await writer.update(filepath, flashcard);
	}
}

export class FlashcardWriterDeleteHandler extends EventHandler<FlashcardWriterDeleteEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardWriterDeleteEvent): Promise<void> {
		const writer = this._writers.get(WriterKey.flashcard)! as FlashcardWriter;
		const settings = this._adapters.get(AdapterKey.settings)! as SettingsAdapter;
		const { uuid } = event.data;
		const filepath = settings.data.flashcard.watch.directory + `/${uuid}.md`;
		await writer.delete(filepath);
	}
}

export class FlashcardWriterFmHandler extends EventHandler<FlashcardWriterFmEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardWriterFmEvent): Promise<void> {
		const writer = this._writers.get(WriterKey.flashcard)! as FlashcardWriter;
		const { filepath, fm } = event.data;
		await writer.updateFrontmatter(filepath, fm);
	}
}

export class FlashcardWriterBodyHandler extends EventHandler<FlashcardWriterBodyEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}
	async handle(event: FlashcardWriterBodyEvent): Promise<void> {
		const writer = this._writers.get(WriterKey.flashcard)! as FlashcardWriter;
		const { front, back, filepath } = event.data;
		await writer.updateBody(filepath, { front, back });
	}
}
