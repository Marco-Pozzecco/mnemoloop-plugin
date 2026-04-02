import { EventData } from './events';

// Entity types supported by the file watcher
export const WatcherEntity = {
	FLASHCARD: 'FLASHCARD',
} as const;

export type WatcherEntity = (typeof WatcherEntity)[keyof typeof WatcherEntity];

// Watcher event types following pattern: WATCHER:[ENTITY]:FILE_[ACTION]
export const WatcherEventType = {
	WatcherFlashcardFileCreate: 'WATCHER:FLASHCARD:FILE_CREATE',
	WatcherFlashcardFileModify: 'WATCHER:FLASHCARD:FILE_MODIFY',
	WatcherFlashcardFileDelete: 'WATCHER:FLASHCARD:FILE_DELETE',
	WatcherFlashcardFileRename: 'WATCHER:FLASHCARD:FILE_RENAME',
} as const;

export type WatcherEventType = (typeof WatcherEventType)[keyof typeof WatcherEventType];

// Event data structure
export type WatcherFlashcardEventData = {
	filepath: string;
	oldPath?: string; // Only for rename events
};

export type WatcherFlashcardCreateEvent = EventData<WatcherFlashcardEventData> & {
	event_type: typeof WatcherEventType.WatcherFlashcardFileCreate;
};

export type WatcherFlashcardModifyEvent = EventData<WatcherFlashcardEventData> & {
	event_type: typeof WatcherEventType.WatcherFlashcardFileModify;
};

export type WatcherFlashcardDeleteEvent = EventData<WatcherFlashcardEventData> & {
	event_type: typeof WatcherEventType.WatcherFlashcardFileDelete;
};

export type WatcherFlashcardRenameEvent = EventData<WatcherFlashcardEventData> & {
	event_type: typeof WatcherEventType.WatcherFlashcardFileRename;
	oldPath: string;
};

export type WatcherFlashcardEvents = {
	create: WatcherFlashcardCreateEvent;
	modify: WatcherFlashcardModifyEvent;
	delete: WatcherFlashcardDeleteEvent;
	rename: WatcherFlashcardRenameEvent;
};
