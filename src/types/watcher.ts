import { EventData } from './events';

// Entity types supported by the file watcher
export const WatcherEntity = {
	FLASHCARD: 'FLASHCARD',
} as const;

export type WatcherEntity = (typeof WatcherEntity)[keyof typeof WatcherEntity];

type Actions = 'CREATE' | 'MODIFY' | 'DELETE' | 'RENAME';

export type WatcherEventKeys =
	`Watcher${Capitalize<Lowercase<WatcherEntity>>}File${Capitalize<Lowercase<Actions>>}`;

export type WatcherEventType = `WATCHER:${WatcherEntity}:FILE_${Actions}`;

export type WatcherEventEnum = Record<WatcherEventKeys, WatcherEventType>;

export const WatcherEventEnum: WatcherEventEnum = {
	WatcherFlashcardFileCreate: 'WATCHER:FLASHCARD:FILE_CREATE',
	WatcherFlashcardFileModify: 'WATCHER:FLASHCARD:FILE_MODIFY',
	WatcherFlashcardFileDelete: 'WATCHER:FLASHCARD:FILE_DELETE',
	WatcherFlashcardFileRename: 'WATCHER:FLASHCARD:FILE_RENAME',
} as const;

// Event data structure
export type WatcherFlashcardEventData = {
	filepath: string;
	oldPath?: string; // Only for rename events
};

export type WatcherFlashcardCreateEvent = EventData<WatcherFlashcardEventData> & {
	event_type: typeof WatcherEventEnum.WatcherFlashcardFileCreate;
};

export type WatcherFlashcardModifyEvent = EventData<WatcherFlashcardEventData> & {
	event_type: typeof WatcherEventEnum.WatcherFlashcardFileModify;
};

export type WatcherFlashcardDeleteEvent = EventData<WatcherFlashcardEventData> & {
	event_type: typeof WatcherEventEnum.WatcherFlashcardFileDelete;
};

export type WatcherFlashcardRenameEvent = EventData<
	WatcherFlashcardEventData & { oldPath: string }
> & {
	event_type: typeof WatcherEventEnum.WatcherFlashcardFileRename;
};

export type WatcherFlashcardEvents = {
	create: WatcherFlashcardCreateEvent;
	modify: WatcherFlashcardModifyEvent;
	delete: WatcherFlashcardDeleteEvent;
	rename: WatcherFlashcardRenameEvent;
};
