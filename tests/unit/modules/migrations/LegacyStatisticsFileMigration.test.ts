import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MigrationContext } from '@/modules/migration/_core/MigrationContext';
import { DATA_FILE, LEGACY_STATISTICS_FILE } from '@/modules/migration/_utils/documents';
import { LegacyStatisticsFileMigration } from '@/modules/migration/migrations/LegacyStatisticsFileMigration';
import { Logger } from '@/utils/Logger';
import { MemoryDocumentStore } from '../../../helpers/memory-document-store';

/** Pre-envelope `statistics.json` shape: a standalone `Stats` document. */
const LEGACY_STATISTICS = {
	progress: {
		'2026-01-01': {
			total_count: 10,
			correct_count: 7,
			incorrect_count: 3,
			retention_rate: 0.7,
			sessions_completed: 1,
			total_duration: 600,
			goal_completed: true,
		},
	},
	sessions: [
		{
			session_id: '00000000-0000-4000-8000-000000000000',
			date: '2026-01-01',
			review_type: 'scheduled',
			start_time: 1767225600000,
			end_time: 1767226200000,
			total_count: 10,
			correct_count: 7,
			incorrect_count: 3,
			duration_s: 600,
		},
	],
	flashcard: {
		retention_rate: 0.7,
		difficulty_dist: { '3': 10 },
		current_streak: 2,
		longest_streak: 5,
		total_cards: 42,
		total_learned: 30,
		total_reviews: 100,
		due_now: 5,
		due_today: 8,
		daily_goal: 20,
		next_review: '2026-01-02T09:00:00.000Z',
		expected_review_time: 1200,
	},
	updated_at: '2026-01-01T12:00:00.000Z',
};

const ENVELOPE = { version: 1, settings: { debounce_timeout_ms: 500 } };

describe('LegacyStatisticsFileMigration', () => {
	let store: MemoryDocumentStore;
	let migration: LegacyStatisticsFileMigration;

	beforeEach(() => {
		store = new MemoryDocumentStore();
		migration = new LegacyStatisticsFileMigration();
	});

	async function run(): Promise<void> {
		const context = new MigrationContext(store);
		await migration.apply(context);
		await context.commit();
	}

	it('should import the legacy file into the envelope and then delete it', async () => {
		store = new MemoryDocumentStore({
			[DATA_FILE]: ENVELOPE,
			[LEGACY_STATISTICS_FILE]: LEGACY_STATISTICS,
		});

		await run();

		expect(store.operations).toEqual([`write:${DATA_FILE}`, `remove:${LEGACY_STATISTICS_FILE}`]);
		expect(store.get(DATA_FILE)).toEqual({ ...ENVELOPE, statistics: LEGACY_STATISTICS });
		expect(store.has(LEGACY_STATISTICS_FILE)).toBe(false);
	});

	it('should do nothing when no legacy file exists', async () => {
		store = new MemoryDocumentStore({ [DATA_FILE]: ENVELOPE });

		await run();

		expect(store.operations).toEqual([]);
		expect(store.get(DATA_FILE)).toBe(ENVELOPE);
	});

	it('should keep the legacy file when the envelope already has statistics', async () => {
		const warnSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => {});
		const statistics = { progress: {}, sessions: [], updated_at: '2026-01-01T00:00:00.000Z' };
		store = new MemoryDocumentStore({
			[DATA_FILE]: { ...ENVELOPE, statistics },
			[LEGACY_STATISTICS_FILE]: LEGACY_STATISTICS,
		});

		await run();

		expect(warnSpy).toHaveBeenCalled();
		expect(store.operations).toEqual([]);
		expect(store.has(LEGACY_STATISTICS_FILE)).toBe(true);
	});

	it('should keep the legacy file when data.json is absent', async () => {
		const warnSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => {});
		store = new MemoryDocumentStore({ [LEGACY_STATISTICS_FILE]: LEGACY_STATISTICS });

		await run();

		expect(warnSpy).toHaveBeenCalled();
		expect(store.operations).toEqual([]);
		expect(store.has(LEGACY_STATISTICS_FILE)).toBe(true);
	});

	it('should keep the legacy file when data.json is not an envelope', async () => {
		const warnSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => {});
		store = new MemoryDocumentStore({
			[DATA_FILE]: { debounce_timeout_ms: 500 },
			[LEGACY_STATISTICS_FILE]: LEGACY_STATISTICS,
		});

		await run();

		expect(warnSpy).toHaveBeenCalled();
		expect(store.operations).toEqual([]);
		expect(store.has(LEGACY_STATISTICS_FILE)).toBe(true);
	});

	it.each([
		['a partial payload', { progress: 'nope' }],
		['an empty payload', {}],
		['a non-object payload', 'statistics'],
	])('should keep the legacy file when it holds %s', async (_label, legacy) => {
		const warnSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => {});
		store = new MemoryDocumentStore({ [DATA_FILE]: ENVELOPE, [LEGACY_STATISTICS_FILE]: legacy });

		await run();

		expect(warnSpy).toHaveBeenCalled();
		expect(store.operations).toEqual([]);
		expect(store.has(LEGACY_STATISTICS_FILE)).toBe(true);
	});

	it('should keep a pre-schema legacy file that no longer parses', async () => {
		// Shape written by the earliest statistics adapter (commit a194b16e).
		const warnSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => {});
		const preSchemaStatistics = {
			version: 1,
			summary: { retention_rate: 0.7, difficulty_dist: {}, total_learned: 30, due_today: 8 },
			last_updated: '2026-01-01T12:00:00.000Z',
			history: [],
			current_streak: 2,
			longest_streak: 5,
			daily_goal: 20,
			progress: [],
			total_cards: 42,
		};
		store = new MemoryDocumentStore({
			[DATA_FILE]: ENVELOPE,
			[LEGACY_STATISTICS_FILE]: preSchemaStatistics,
		});

		await run();

		expect(warnSpy).toHaveBeenCalled();
		expect(store.operations).toEqual([]);
		expect(store.has(LEGACY_STATISTICS_FILE)).toBe(true);
	});

	it('should keep the legacy file when it cannot be read', async () => {
		const warnSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => {});
		store = new MemoryDocumentStore({
			[DATA_FILE]: ENVELOPE,
			[LEGACY_STATISTICS_FILE]: LEGACY_STATISTICS,
		});
		vi.spyOn(store, 'read').mockImplementation(async (name: string) => {
			if (name === LEGACY_STATISTICS_FILE) {
				throw new Error(`failed to parse ${LEGACY_STATISTICS_FILE}`);
			}
			return store.get(name);
		});

		await run();

		expect(warnSpy).toHaveBeenCalled();
		expect(store.operations).toEqual([]);
		expect(store.has(LEGACY_STATISTICS_FILE)).toBe(true);
	});
});
