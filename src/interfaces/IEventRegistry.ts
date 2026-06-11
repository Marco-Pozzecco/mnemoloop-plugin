import { Adapters } from '@/types/adapters';
import { Indexes } from '@/types/indexes';
import { Parsers } from '@/types/parsers';
import { Writers } from '@/types/writers';
import { Plugin } from 'obsidian';
import { IEvent } from './IEvent';
import { IEventHandler } from './IEventHandler';
import { EventBus } from '@/modules/events';

export interface IEventRegistryDependencies {
	plugin: Plugin;
	adapters: Adapters;
	indexes: Indexes;
	parsers: Parsers;
	writers: Writers;
	bus: EventBus;
}

export type EventClass<T> = {
	new (data: T): IEvent<T>;
	readonly type: string;
};

export type EventHandlerClass = {
	new (deps: IEventRegistryDependencies): IEventHandler;
};

export interface IEventRegistry {
	initialize(): void;
	dispose(): void;
}
