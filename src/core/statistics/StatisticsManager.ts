import { App } from 'obsidian';
import { IStatsManager } from './utils/contract';
import { FlashcardMetadata } from '../indexer/schema/IndexerSchema';
import { ReviewSession, ReviewSessionSchema, Stats, StatsSchema } from './schema/StatisticsSchema';
import { StatisticsEngine } from './StatisticsEngine';
import { DEFAULT_STATISTICS } from '@/utils/constants';

export class StatisticsManager implements IStatsManager {
	static instance: StatisticsManager;
	private app: App;
	private stats: Stats = DEFAULT_STATISTICS;
	private version: number = 1;
	private readonly STATS_FILE = 'knowledge-accelerator/stats.json';
	engine: StatisticsEngine;

	constructor(app: App) {
		this.app = app;
		this.engine = new StatisticsEngine();
	}

	get statistics(): Stats {
		return this.stats;
	}

	static getInstance(app: App): StatisticsManager {
		if (!StatisticsManager.instance) {
			StatisticsManager.instance = new StatisticsManager(app);
		}
		return StatisticsManager.instance;
	}

	async load(): Promise<void> {
		try {
			const adapter = this.app.vault.adapter;

			if (await adapter.exists(this.STATS_FILE)) {
				const data = await adapter.read(this.STATS_FILE);
				const parsedStats: unknown = JSON.parse(data);

				const validatedStats = StatsSchema.parse(parsedStats);

				if (validatedStats.version !== this.version) {
					console.warn(
						`Stats version mismatch: expected ${this.version}, got ${validatedStats.version}`,
					);
				}

				this.stats = validatedStats;
			} else {
				await this.save();
			}
		} catch (error) {
			console.error('Failed to load stats:', error);
			// Don't throw on parse errors to allow recovery
			if (error instanceof Error && error.message.includes('JSON.parse')) {
				console.warn('Stats file corrupted, will create new one');
				this.stats = DEFAULT_STATISTICS;
				await this.save();
				return;
			}
			throw new Error(
				`Stats loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	async save(): Promise<void> {
		try {
			const adapter = this.app.vault.adapter;

			// Ensure directory exists
			const dir = this.STATS_FILE.split('/').slice(0, -1).join('/');
			if (!(await adapter.exists(dir))) {
				await adapter.mkdir(dir);
			}

			const validatedStats = StatsSchema.parse(this.stats);
			await adapter.write(this.STATS_FILE, JSON.stringify(validatedStats, null, 2));
		} catch (error) {
			console.error('Failed to save stats:', error);
			throw new Error(
				`Stats saving failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	async recordSession(session: ReviewSession): Promise<void> {
		const parsedSession = ReviewSessionSchema.parse(session);
		this.stats.history.push(parsedSession);
		await this.save();
	}

	recomputeAll(index: Record<string, FlashcardMetadata>): void {
		const cards = Object.values(index).filter((card) => card.status === 'ACTIVE');

		this.stats.summary = this.engine.generateSummary(cards);
		this.stats.last_updated = new Date().toISOString();
	}
}
