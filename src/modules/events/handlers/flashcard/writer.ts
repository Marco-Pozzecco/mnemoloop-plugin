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
			this._bus.publish(new FlashcardWriterCreateResponseEvent({ filepath: flashcardPath }));
		} catch (err) {
			Logger.error('Failed to create flashcard', err);
			new Notice('Failed to create flashcard');
		}
	}
}

export class FlashcardWriterUpdateHandler extends EventHandler<FlashcardWriterUpdateRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardWriterUpdateRequestEvent): Promise<void> {
		const writer = this._writers.get(WriterKey.flashcard)! as FlashcardWriter;
		const settings = this._adapters.get(AdapterKey.settings)! as SettingsAdapter;
		const { uuid, front, back, source } = event.data;
		const flashcard = { ...DEFAULT_FLASHCARD_YAML, uuid, source, front, back };
		const filepath = settings.data.flashcard.watch.directory + `/${uuid}.md`;
		await writer.update(filepath, flashcard);
		this._bus.publish(new FlashcardWriterUpdateResponseEvent({ filepath }));
	}
}

export class FlashcardWriterDeleteHandler extends EventHandler<FlashcardWriterDeleteRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardWriterDeleteRequestEvent): Promise<void> {
		const writer = this._writers.get(WriterKey.flashcard)! as FlashcardWriter;
		const settings = this._adapters.get(AdapterKey.settings)! as SettingsAdapter;
		const { uuid } = event.data;
		const filepath = settings.data.flashcard.watch.directory + `/${uuid}.md`;
		await writer.delete(filepath);
		this._bus.publish(new FlashcardWriterDeleteResponseEvent({ filepath }));
	}
}

export class FlashcardWriterFmHandler extends EventHandler<FlashcardWriterFmRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: FlashcardWriterFmRequestEvent): Promise<void> {
		const writer = this._writers.get(WriterKey.flashcard)! as FlashcardWriter;
		const { filepath, fm } = event.data;
		await writer.updateFrontmatter(filepath, fm);
		this._bus.publish(new FlashcardWriterFmResponseEvent({ filepath }));
	}
}

export class FlashcardWriterBodyHandler extends EventHandler<FlashcardWriterBodyRequestEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}
	async handle(event: FlashcardWriterBodyRequestEvent): Promise<void> {
		const writer = this._writers.get(WriterKey.flashcard)! as FlashcardWriter;
		const { front, back, filepath } = event.data;
		await writer.updateBody(filepath, { front, back });
		this._bus.publish(new FlashcardWriterBodyResponseEvent({ filepath }));
	}
}
