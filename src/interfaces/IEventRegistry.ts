import { Plugin } from 'obsidian';
import { IEvent } from './IEvent';
import { Adapters } from '@/types/adapters';
import { Indexes } from '@/types/indexes';
import { Parsers } from '@/types/parsers';
import { IEventHandler } from './IEventHandler';

export interface IEventRegistryDependencies {
	plugin: Plugin;
	adapters: Adapters;
	indexes: Indexes;
	parsers: Parsers;
}

export interface IEventRegistry {
	register(factory: (deps: IEventRegistryDependencies) => IEventHandler<IEvent>): void;
	initialize(deps: IEventRegistryDependencies): void;
	dispose(): void;
}
