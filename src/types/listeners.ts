import { FileWatcherListener } from '@/modules/event-listeners/FileWatcherListener';
import { FlashcardWriterProcess } from '@/modules/event-listeners/FlashcardWriterProcessor';
import { StatisticsListener } from '@/modules/event-listeners/StatisticsListener';

export enum ListenerKey {
	statistics = 'statistics',
	fileWatcher = 'fileWatcher',
	flashcardProcessor = 'flashcardProcessor',
}

interface ListenerMap {
	[ListenerKey.statistics]: StatisticsListener;
	[ListenerKey.fileWatcher]: FileWatcherListener;
	[ListenerKey.flashcardProcessor]: FlashcardWriterProcess;
}

export type ListenerType<K extends ListenerKey = ListenerKey> = ListenerMap[K];
export type Listeners = Map<ListenerKey, ListenerType>;
