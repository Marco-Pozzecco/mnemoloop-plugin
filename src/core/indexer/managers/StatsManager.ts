import { App } from 'obsidian';
import { IStatsManager } from '../contracts/IStatsManager';
import { StatsSchema, Stats, StatisticsSummary } from '../schema/statsSchema';
import { CardMetadata } from '../schema/indexSchema';
import { StatisticsEngine } from '../statistics/StatisticsEngine';

export class StatsManager implements IStatsManager {
	static instance: StatsManager;
	private app: App;
	private stats: Stats;
	private version: number = 1;
	private readonly STATS_FILE = 'knowledge-accelerator/stats.json';
	engine: StatisticsEngine;

	constructor(app: App) {
		this.app = app;
		this.engine = new StatisticsEngine();
		this.stats = this.createEmptyStats();
	}

	static getInstance(app: App): StatsManager {
		if (!StatsManager.instance) {
			StatsManager.instance = new StatsManager(app);
		}
		return StatsManager.instance;
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
				this.stats = this.createEmptyStats();
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

	recordReview(cardId: string, rating: number, success: boolean): void {
		Object.values([{ cardId, rating, success }]); // to be deleted
		// In a real implementation, this would update the review history
		// For now, we just mark the stats as needing recomputation
		this.stats.last_updated = new Date().toISOString();
	}

	getSummary(): StatisticsSummary {
		return { ...this.stats.summary };
	}

	recomputeAll(index: Record<string, CardMetadata>): void {
		const cards = Object.values(index).filter((card) => card.status === 'ACTIVE');

		this.stats.summary = this.engine.generateSummary(cards);
		this.stats.last_updated = new Date().toISOString();
	}

	private createEmptyStats(): Stats {
		return {
			version: this.version,
			summary: {
				retention_rate: 0,
				difficulty_dist: {},
				total_learned: 0,
				due_today: 0,
			},
			last_updated: new Date().toISOString(),
		};
	}
}
