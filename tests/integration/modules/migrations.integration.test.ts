import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsAdapter } from '@/modules/adapters/SettingsAdapter';
import { StatisticsAdapter } from '@/modules/adapters/StatisticsAdapter';
import {
	LATEST_DATA_VERSION,
	MIGRATIONS,
	Migrator,
	PluginDocumentStore,
} from '@/modules/migration';
import { LEGACY_STATISTICS_FILE } from '@/modules/migration/_utils/documents';
import { DEFAULT_PLUGIN_SETTINGS } from '@/schemas/settings';
import { DEFAULT_STATISTICS } from '@/schemas/statistics';
import { JsonData } from '@/schemas/json-data';
import { simpleClone } from '@/utils/Clone';
import { Logger } from '@/utils/Logger';
import { createMockPlugin } from '../../helpers/mock-obsidian';

const PLUGIN_DIR = '/test-plugin';
const STATISTICS_PATH = `${PLUGIN_DIR}/${LEGACY_STATISTICS_FILE}`;

/** Pre-envelope `data.json` shape: a full `PluginSettings` stored flat at the root. */
const FLAT_SETTINGS = simpleClone(DEFAULT_PLUGIN_SETTINGS);

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

describe('data migrations integration', () => {
	let plugin: any;
	let stored: unknown;

	beforeEach(() => {
		plugin = createMockPlugin([
			{ path: STATISTICS_PATH, content: JSON.stringify(LEGACY_STATISTICS) },
		]);
		plugin.manifest = { dir: PLUGIN_DIR };
		plugin.app.vault.adapter.remove = vi.fn(async (path: string) => {
			plugin.app.vault.fileMap.delete(path);
		});
		stored = { ...FLAT_SETTINGS };
		plugin.loadData.mockImplementation(async () => stored ?? null);
		plugin.saveData.mockImplementation(async (data: unknown) => {
			stored = data;
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	function runMigrations(): Promise<void> {
		return new Migrator(new PluginDocumentStore(plugin), MIGRATIONS).run();
	}

	it('should derive the current data version from the migration catalog', () => {
		expect(LATEST_DATA_VERSION).toBe(
			Math.max(...MIGRATIONS.map((migration) => migration.toVersion)),
		);
	});

	it('should migrate a legacy data.json and statistics.json before the adapters read them', async () => {
		await runMigrations();

		expect(stored).toEqual({
			version: LATEST_DATA_VERSION,
			settings: FLAT_SETTINGS,
			statistics: LEGACY_STATISTICS,
		});
		expect(plugin.app.vault.fileMap.has(STATISTICS_PATH)).toBe(false);

		const saveCallsAfterMigration = plugin.saveData.mock.calls.length;
		const settingsAdapter = new SettingsAdapter(plugin);
		const statisticsAdapter = new StatisticsAdapter(plugin);
		await settingsAdapter.initialize();
		await statisticsAdapter.initialize();

		expect(settingsAdapter.data).toEqual(FLAT_SETTINGS);
		expect(statisticsAdapter.data).toEqual(LEGACY_STATISTICS);
		expect(plugin.saveData).toHaveBeenCalledTimes(saveCallsAfterMigration);
	});

	it('should preserve the version when the adapters save migrated data', async () => {
		await runMigrations();
		const settingsAdapter = new SettingsAdapter(plugin);
		const statisticsAdapter = new StatisticsAdapter(plugin);
		await settingsAdapter.initialize();
		await statisticsAdapter.initialize();

		await settingsAdapter.save();
		await statisticsAdapter.save();

		const data = stored as JsonData;
		expect(data.version).toBe(LATEST_DATA_VERSION);
		expect(data.settings).toEqual(FLAT_SETTINGS);
		expect(data.statistics).toEqual(LEGACY_STATISTICS);
	});

	it('should perform no writes when the stored version is already current', async () => {
		await runMigrations();
		plugin.saveData.mockClear();
		plugin.app.vault.adapter.remove.mockClear();

		await runMigrations();

		expect(plugin.saveData).not.toHaveBeenCalled();
		expect(plugin.app.vault.adapter.remove).not.toHaveBeenCalled();
		expect(stored).toEqual({
			version: LATEST_DATA_VERSION,
			settings: FLAT_SETTINGS,
			statistics: LEGACY_STATISTICS,
		});
	});

	it('should keep the version when the adapters seed defaults on a fresh install', async () => {
		stored = undefined;

		await runMigrations();

		expect(stored).toEqual({ version: LATEST_DATA_VERSION });

		const settingsAdapter = new SettingsAdapter(plugin);
		const statisticsAdapter = new StatisticsAdapter(plugin);
		await settingsAdapter.initialize();
		await statisticsAdapter.initialize();

		expect(settingsAdapter.data).toEqual(DEFAULT_PLUGIN_SETTINGS);
		expect(statisticsAdapter.data).toEqual(DEFAULT_STATISTICS);
		expect((stored as JsonData).version).toBe(LATEST_DATA_VERSION);
	});

	it('should migrate a fresh install that has no legacy statistics.json without warnings', async () => {
		const warnSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => {});
		const errorSpy = vi.spyOn(Logger, 'error').mockImplementation(() => {});
		stored = undefined;
		plugin.app.vault.fileMap.delete(STATISTICS_PATH);

		await runMigrations();

		expect(warnSpy).not.toHaveBeenCalled();
		expect(errorSpy).not.toHaveBeenCalled();
		expect(stored).toEqual({ version: LATEST_DATA_VERSION });

		const settingsAdapter = new SettingsAdapter(plugin);
		const statisticsAdapter = new StatisticsAdapter(plugin);
		await settingsAdapter.initialize();
		await statisticsAdapter.initialize();

		expect(settingsAdapter.data).toEqual(DEFAULT_PLUGIN_SETTINGS);
		expect(statisticsAdapter.data).toEqual(DEFAULT_STATISTICS);
		expect(stored).toEqual({
			version: LATEST_DATA_VERSION,
			settings: DEFAULT_PLUGIN_SETTINGS,
			statistics: DEFAULT_STATISTICS,
		});
		expect(plugin.app.vault.fileMap.has(STATISTICS_PATH)).toBe(false);
	});

	it('should wrap flat settings when no legacy statistics.json exists', async () => {
		const warnSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => {});
		plugin.app.vault.fileMap.delete(STATISTICS_PATH);

		await runMigrations();

		expect(warnSpy).not.toHaveBeenCalled();
		expect(stored).toEqual({ version: LATEST_DATA_VERSION, settings: FLAT_SETTINGS });

		const statisticsAdapter = new StatisticsAdapter(plugin);
		await statisticsAdapter.initialize();

		expect(statisticsAdapter.data).toEqual(DEFAULT_STATISTICS);
		expect(stored).toEqual({
			version: LATEST_DATA_VERSION,
			settings: FLAT_SETTINGS,
			statistics: DEFAULT_STATISTICS,
		});
	});

	it('should leave a legacy statistics.json in place when data.json is absent', async () => {
		const warnSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => {});
		stored = undefined;

		await runMigrations();

		// The legacy file cannot be imported without an envelope, so it is kept and
		// the stamped version means the next load never retries the import.
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('is not an envelope'));
		expect(stored).toEqual({ version: LATEST_DATA_VERSION });
		expect(plugin.app.vault.fileMap.has(STATISTICS_PATH)).toBe(true);

		const statisticsAdapter = new StatisticsAdapter(plugin);
		await statisticsAdapter.initialize();

		expect(statisticsAdapter.data).toEqual(DEFAULT_STATISTICS);
		expect(plugin.app.vault.fileMap.has(STATISTICS_PATH)).toBe(true);
	});
});
