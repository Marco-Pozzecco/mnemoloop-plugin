import { Plugin } from 'obsidian';
import { IEventHandler } from './IEventHandler';
import { Adapters } from '@/types/adapters';
import { Indexes } from '@/types/indexes';
import { Parsers } from '@/types/parsers';
import { IEvent } from './IEvent';

export interface IEventRegistryDependencies {
	plugin: Plugin;
	adapters: Adapters;
	indexes: Indexes;
	parsers: Parsers;
}

export type EventClass = {
	new (...args: unknown[]): IEvent;
	readonly type: string;
};

export type EventHandlerClass = {
	new (deps: IEventRegistryDependencies): IEventHandler;
};

export interface IEventRegistry {
	register(Event: EventClass, Handler: EventHandlerClass): void;
	initialize(deps: IEventRegistryDependencies): void;
	dispose(): void;
}
