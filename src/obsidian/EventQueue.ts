import { IVaultEvent } from './contracts/IVaultWatcher';
import { IEventQueue, IEventQueueConfig, IQueueStatus, EventProcessor } from './contracts/IEventQueue';

export class EventQueue implements IEventQueue {
	private events: IVaultEvent[] = [];
	private processing: boolean = false;
	private lastEventTime: string | null = null;
	private debounceTimer: NodeJS.Timeout | null = null;
	private processor: EventProcessor | null = null;
	private config: IEventQueueConfig;

	constructor(config: IEventQueueConfig) {
		this.config = config;
	}

	enqueue(event: IVaultEvent): void {
		this.lastEventTime = event.timestamp;

		if (this.processor === null) {
			throw new Error('EventProcessor not set. Call setProcessor() first.');
		}

		this.deduplicateAndEnqueue(event);
		this.resetDebounceTimer();
	}

	async flush(): Promise<void> {
		this.cancelDebounceTimer();
		await this.processQueue();
	}

	cancel(): void {
		this.cancelDebounceTimer();
		this.clear();
	}

	getStatus(): IQueueStatus {
		return {
			queuedCount: this.events.length,
			isProcessing: this.processing,
			lastEventTime: this.lastEventTime,
			debounceActive: this.debounceTimer !== null,
		};
	}

	setProcessor(processor: EventProcessor): void {
		this.processor = processor;
	}

	clear(): void {
		this.events = [];
		this.lastEventTime = null;
	}

	private async processQueue(): Promise<void> {
		if (this.processing || this.events.length === 0) {
			return;
		}

		this.processing = true;

		try {
			const eventsToProcess = [...this.events];
			this.events = [];

			if (this.processor) {
				await this.processor(eventsToProcess);
			}
		} finally {
			this.processing = false;
		}
	}

	private resetDebounceTimer(): void {
		this.cancelDebounceTimer();

		this.debounceTimer = setTimeout(async () => {
			await this.processQueue();
		}, this.config.debounceTimeoutMs);
	}

	private cancelDebounceTimer(): void {
		if (this.debounceTimer !== null) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
	}

	private deduplicateAndEnqueue(event: IVaultEvent): void {
		if (event.type === 'modify') {
			const existingIndex = this.events.findIndex(
				(e) => e.type === 'modify' && e.filePath === event.filePath
			);

			if (existingIndex !== -1) {
				this.events[existingIndex] = event;
				return;
			}
		}

		if (this.config.maxQueueSize && this.events.length >= this.config.maxQueueSize) {
			console.warn(`Event queue full (${this.config.maxQueueSize}), dropping oldest event`);
			this.events.shift();
		}

		this.events.push(event);
	}
}
