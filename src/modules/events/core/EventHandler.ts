import { IEvent } from '@/interfaces/IEvent';
import { IEventHandler } from '@/interfaces/IEventHandler';
import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { Adapters } from '@/types/adapters';
import { Indexes } from '@/types/indexes';
import { Parsers } from '@/types/parsers';
import { Writers } from '@/types/writers';
import { Plugin } from 'obsidian';
import { EventBus } from './EventBus';

export abstract class EventHandler<E extends IEvent> implements IEventHandler {
	protected _indexers: Indexes;
	protected _parsers: Parsers;
	protected _adapters: Adapters;
	protected _plugin: Plugin;
	protected _writers: Writers;
	protected _bus: EventBus;

	constructor(deps: IEventRegistryDependencies) {
		this._indexers = deps.indexes;
		this._parsers = deps.parsers;
		this._adapters = deps.adapters;
		this._plugin = deps.plugin;
		this._writers = deps.writers;
		this._bus = deps.bus;
	}

	abstract handle(_event: E): Promise<void>;
}
