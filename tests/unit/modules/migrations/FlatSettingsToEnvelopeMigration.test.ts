import { beforeEach, describe, expect, it } from 'vitest';
import { MigrationContext } from '@/modules/migration/_core/MigrationContext';
import { DATA_FILE } from '@/modules/migration/_utils/documents';
import { FlatSettingsToEnvelopeMigration } from '@/modules/migration/migrations/FlatSettingsToEnvelopeMigration';
import { MemoryDocumentStore } from '../../../helpers/memory-document-store';

/** Pre-envelope `data.json` shape: settings stored flat at the root. */
const FLAT_SETTINGS = {
	flashcard: {
		marker: '?',
		watch: { directory: '/flashcards', tags: ['#flashcard'] },
	},
	source_note: {
		watch: { directory: '', tags: [] },
	},
	debounce_timeout_ms: 500,
	enable_soft_delete: true,
	soft_delete_hours: 24,
	banner_dismissals: {},
};

const LEGACY_STATISTICS = { progress: {}, sessions: [], updated_at: '2026-01-01T00:00:00.000Z' };

describe('FlatSettingsToEnvelopeMigration', () => {
	let store: MemoryDocumentStore;
	let migration: FlatSettingsToEnvelopeMigration;

	beforeEach(() => {
		store = new MemoryDocumentStore();
		migration = new FlatSettingsToEnvelopeMigration();
	});

	async function run(): Promise<void> {
		const context = new MigrationContext(store);
		await migration.apply(context);
		await context.commit();
	}

	it('should wrap a full flat settings payload into the settings key', async () => {
		store = new MemoryDocumentStore({ [DATA_FILE]: FLAT_SETTINGS });

		await run();

		expect(store.operations).toEqual([`write:${DATA_FILE}`]);
		expect(store.get(DATA_FILE)).toEqual({ settings: FLAT_SETTINGS });
	});

	it.each(Object.entries(FLAT_SETTINGS))(
		'should detect a flat payload through its %s key',
		async (key, value) => {
			store = new MemoryDocumentStore({ [DATA_FILE]: { [key]: value } });

			await run();

			expect(store.get(DATA_FILE)).toEqual({ settings: { [key]: value } });
		},
	);

	it('should preserve an existing statistics key', async () => {
		store = new MemoryDocumentStore({
			[DATA_FILE]: { ...FLAT_SETTINGS, statistics: LEGACY_STATISTICS },
		});

		await run();

		expect(store.get(DATA_FILE)).toEqual({
			settings: FLAT_SETTINGS,
			statistics: LEGACY_STATISTICS,
		});
	});

	it('should leave an already-enveloped payload untouched', async () => {
		const envelope = { settings: FLAT_SETTINGS, statistics: LEGACY_STATISTICS };
		store = new MemoryDocumentStore({ [DATA_FILE]: envelope });

		await run();

		expect(store.operations).toEqual([]);
		expect(store.get(DATA_FILE)).toBe(envelope);
	});

	it('should leave an unrecognized payload untouched', async () => {
		// Shape written before the snake_case settings schema (commit 86167183).
		const unrecognized = { flashcardsDirectory: 'flashcards', debounceTimeoutMs: 500 };
		store = new MemoryDocumentStore({ [DATA_FILE]: unrecognized });

		await run();

		expect(store.operations).toEqual([]);
		expect(store.get(DATA_FILE)).toBe(unrecognized);
	});

	it.each([
		['null', null],
		['a string', 'settings'],
		['an array', ['flashcard']],
	])('should leave %s untouched', async (_label, payload) => {
		store = new MemoryDocumentStore({ [DATA_FILE]: payload });

		await run();

		expect(store.operations).toEqual([]);
		expect(store.get(DATA_FILE)).toBe(payload);
	});

	it('should leave an absent data.json untouched', async () => {
		await run();

		expect(store.operations).toEqual([]);
		expect(store.has(DATA_FILE)).toBe(false);
	});
});
