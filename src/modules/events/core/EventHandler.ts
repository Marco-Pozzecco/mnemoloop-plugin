import { IEvent } from '@/interfaces/IEvent';
import { IEventHandler } from '@/interfaces/IEventHandler';
import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { Adapters } from '@/types/adapters';
import { Indexes } from '@/types/indexes';
import { Parsers } from '@/types/parsers';
import { Plugin } from 'obsidian';

export abstract class EventHandler<E extends IEvent> implements IEventHandler {
	protected _indexers: Indexes;
	protected _parsers: Parsers;
	protected _adapters: Adapters;
	protected _plugin: Plugin;

	constructor(deps: IEventRegistryDependencies) {
		this._indexers = deps.indexes;
		this._parsers = deps.parsers;
		this._adapters = deps.adapters;
		this._plugin = deps.plugin;
	}

	abstract handle(_event: E): void | Promise<void>;
}
