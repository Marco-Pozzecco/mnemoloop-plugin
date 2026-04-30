import { Event } from '../core';

export enum WatcherEntity {
	Flashcard = 'flashcard',
}

export enum WatcherAction {
	Create = 'create',
	Modify = 'modify',
	Delete = 'delete',
	Rename = 'rename',
}

type WatcherEventType = `${Capitalize<WatcherEntity>}:Watcher:${Capitalize<WatcherAction>}`;
export type FileWatcherCreateData = { path: string };
export type FileWatcherModifyData = { path: string };
export type FileWatcherDeleteData = { path: string };
export type FileWatcherRenameData = {
	path: string;
	oldPath: string;
};

// File Watcher Events
export class FlashcardWatcherCreateEvent extends Event<FileWatcherCreateData> {
	static readonly type: WatcherEventType = 'Flashcard:Watcher:Create';

	constructor(data: FileWatcherCreateData) {
		super(FlashcardWatcherCreateEvent.type, data);
	}
}

export class FlashcardWatcherModifyEvent extends Event<FileWatcherModifyData> {
	static readonly type: WatcherEventType = 'Flashcard:Watcher:Modify';

	constructor(data: FileWatcherModifyData) {
		super(FlashcardWatcherModifyEvent.type, data);
	}
}

export class FlashcardWatcherDeleteEvent extends Event<FileWatcherDeleteData> {
	static readonly type: WatcherEventType = 'Flashcard:Watcher:Delete';

	constructor(data: FileWatcherDeleteData) {
		super(FlashcardWatcherDeleteEvent.type, data);
	}
}

export class FlashcardWatcherRenameEvent extends Event<FileWatcherRenameData> {
	static readonly type: WatcherEventType = 'Flashcard:Watcher:Rename';

	constructor(data: FileWatcherRenameData) {
		super(FlashcardWatcherRenameEvent.type, data);
	}

	/** Get the old file path */
	get oldPath(): string {
		return this.data.oldPath;
	}
}
