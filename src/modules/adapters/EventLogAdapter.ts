import { IEvent } from '@/interfaces/IEvent';
import { Logger } from '@/utils/Logger';
import { Plugin } from 'obsidian';
import { BaseAdapter } from './BaseAdapter';
import { EventLog, EventLogEntry, EventLogSchema } from '@/schemas/event-log';

const DEFAULT_DATA: EventLog = { events: [] };

export class EventLogAdapter extends BaseAdapter<EventLog> {
	private readonly _plugin: Plugin;
	private readonly _path: string;
	private _buffer: EventLogEntry[] = [];
	private _dirty = false;
	private _flushTimer?: number;
	private static readonly MAX_EVENTS = 1000;
	private static readonly FLUSH_DEBOUNCE_MS = 500;

	constructor(plugin: Plugin) {
		super(DEFAULT_DATA, EventLogSchema);
		this._plugin = plugin;
		this._path = `${plugin.manifest.dir}/event-log.json`;
	}

	/** Tap sink — invoked by EventBus.publish for every event. */
	log(event: IEvent<unknown>): void {
		this._buffer.push({
			id: event.id,
			time: event.time.toISOString(),
			type: event.type,
			data: event.data,
		});

		if (this._buffer.length > EventLogAdapter.MAX_EVENTS) {
			this._buffer.splice(0, this._buffer.length - EventLogAdapter.MAX_EVENTS);
		}

		this._dirty = true;
		window.clearTimeout(this._flushTimer);
		this._flushTimer = window.setTimeout(() => {
			void this.flush();
		}, EventLogAdapter.FLUSH_DEBOUNCE_MS);
	}

	/** Flush pending buffer to disk. Safe to call repeatedly. */
	async flush(): Promise<void> {
		if (!this._dirty) return;
		try {
			this._data = { events: this._buffer };
			await this.save();
			this._dirty = false;
		} catch (err) {
			Logger.error('EventLogAdapter flush failed', err);
		}
	}

	/** Clean up timer. */
	dispose(): void {
		window.clearTimeout(this._flushTimer);
	}

	protected async loadData(): Promise<unknown> {
		try {
			const exists = await this._plugin.app.vault.adapter.exists(this._path);
			if (exists) {
				const content = await this._plugin.app.vault.adapter.read(this._path);
				const parsed = JSON.parse(content) as EventLog;
				if (Array.isArray(parsed.events)) {
					this._buffer = parsed.events.slice(-EventLogAdapter.MAX_EVENTS);
				}
				return parsed;
			}

			return this.defaultData;
		} catch (err) {
			Logger.error('EventLogAdapter load failed', err);
		}
	}

	protected async saveData(data: EventLog): Promise<void> {
		const exists = await this._plugin.app.vault.adapter.exists(this._path);
		const serialized = JSON.stringify(data);
		if (exists) {
			await this._plugin.app.vault.adapter.write(this._path, serialized);
		} else {
			await this._plugin.app.vault.create(this._path, serialized);
		}
	}
}
