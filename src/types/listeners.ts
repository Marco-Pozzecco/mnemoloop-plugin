import { StatisticsListener } from "@/modules/event-listeners/StatisticsListener";

export enum ListenerKey {
  statistics = 'statistics'
}

interface ListenerMap {
  [ListenerKey.statistics]: StatisticsListener;
}

export type ListenerType<K extends ListenerKey = ListenerKey> = ListenerMap[K];
export type Listeners = Map<ListenerKey, ListenerType>;
