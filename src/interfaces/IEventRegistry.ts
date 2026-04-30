import { Plugin } from 'obsidian';
import { Adapters } from '@/types/adapters';
import { Indexes } from '@/types/indexes';
import { Parsers } from '@/types/parsers';
import { IEventProcessor } from './IEventProcessor';

export interface IEventRegistryDependencies {
	plugin: Plugin;
	adapters: Adapters;
	indexes: Indexes;
	parsers: Parsers;
}

export interface IEventRegistry {
	register<Key extends string>(
		key: Key,
		factory: (deps: IEventRegistryDependencies) => IEventProcessor,
	): void;

	initialize(deps: IEventRegistryDependencies): void;
	dispose(): void;

	getProcessor<Key extends string>(key: Key): IEventProcessor | undefined;
	hasProcessor(key: string): boolean;
}
