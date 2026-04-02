import { FileWatcherListener } from '@/modules/event-listeners/FileWatcherListener';
import { StatisticsListener } from '@/modules/event-listeners/StatisticsListener';

export enum ListenerKey {
	statistics = 'statistics',
	fileWatcher = 'fileWatcher',
}

interface ListenerMap {
	[ListenerKey.statistics]: StatisticsListener;
	[ListenerKey.fileWatcher]: FileWatcherListener;
}

export type ListenerType<K extends ListenerKey = ListenerKey> = ListenerMap[K];
export type Listeners = Map<ListenerKey, ListenerType>;
