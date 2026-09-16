import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PluginDocumentStore } from '@/modules/migration/_core/PluginDocumentStore';
import { DATA_FILE, LEGACY_STATISTICS_FILE } from '@/modules/migration/_utils/documents';
import { createMockPlugin } from '../../../helpers/mock-obsidian';

const PLUGIN_DIR = '/test-plugin';
const STATISTICS_PATH = `${PLUGIN_DIR}/${LEGACY_STATISTICS_FILE}`;
const STORED_STATISTICS = { progress: {}, sessions: [], updated_at: '2026-01-01T00:00:00.000Z' };

describe('PluginDocumentStore', () => {
	let plugin: any;
	let store: PluginDocumentStore;

	beforeEach(() => {
		plugin = createMockPlugin([
			{ path: STATISTICS_PATH, content: JSON.stringify(STORED_STATISTICS) },
		]);
		plugin.manifest = { dir: PLUGIN_DIR };
		plugin.app.vault.adapter.remove = vi.fn(async (path: string) => {
			plugin.app.vault.fileMap.delete(path);
		});
		store = new PluginDocumentStore(plugin);
	});

	describe('read', () => {
		it('should read data.json through the plugin API', async () => {
			const envelope = { version: 2, settings: {}, statistics: {} };
			plugin.loadData.mockResolvedValue(envelope);

			await expect(store.read(DATA_FILE)).resolves.toEqual(envelope);
		});

		it('should treat a null data.json as absent', async () => {
			plugin.loadData.mockResolvedValue(null);

			await expect(store.read(DATA_FILE)).resolves.toBeUndefined();
		});

		it('should read a vault document as parsed JSON', async () => {
			await expect(store.read(LEGACY_STATISTICS_FILE)).resolves.toEqual(STORED_STATISTICS);
		});

		it('should return undefined for an absent vault document', async () => {
			await expect(store.read('missing.json')).resolves.toBeUndefined();
			expect(plugin.app.vault.adapter.read).not.toHaveBeenCalled();
		});

		it('should return undefined for an empty vault document', async () => {
			plugin.app.vault.fileMap.set(STATISTICS_PATH, '');

			await expect(store.read(LEGACY_STATISTICS_FILE)).resolves.toBeUndefined();
		});

		it('should reject when a vault document is not valid JSON', async () => {
			plugin.app.vault.fileMap.set(STATISTICS_PATH, '{ not json');

			await expect(store.read(LEGACY_STATISTICS_FILE)).rejects.toThrow(
				`failed to parse ${STATISTICS_PATH}`,
			);
		});
	});

	describe('write', () => {
		it('should write data.json through the plugin API', async () => {
			const envelope = { version: 2 };
			await store.write(DATA_FILE, envelope);

			expect(plugin.saveData).toHaveBeenCalledWith(envelope);
			expect(plugin.app.vault.adapter.write).not.toHaveBeenCalled();
		});

		it('should overwrite an existing vault document', async () => {
			await store.write(LEGACY_STATISTICS_FILE, { replaced: true });

			expect(plugin.app.vault.adapter.write).toHaveBeenCalledWith(
				STATISTICS_PATH,
				JSON.stringify({ replaced: true }),
			);
			expect(plugin.app.vault.create).not.toHaveBeenCalled();
		});

		it('should create a missing vault document in the plugin directory', async () => {
			await store.write('missing.json', { created: true });

			expect(plugin.app.vault.create).toHaveBeenCalledWith(
				`${PLUGIN_DIR}/missing.json`,
				JSON.stringify({ created: true }),
			);
			expect(plugin.app.vault.adapter.write).not.toHaveBeenCalled();
		});
	});

	describe('remove', () => {
		it('should remove a vault document from the plugin directory', async () => {
			await store.remove(LEGACY_STATISTICS_FILE);

			expect(plugin.app.vault.adapter.remove).toHaveBeenCalledWith(STATISTICS_PATH);
			expect(plugin.app.vault.fileMap.has(STATISTICS_PATH)).toBe(false);
		});

		it('should reject removing data.json', async () => {
			await expect(store.remove(DATA_FILE)).rejects.toThrow('cannot be removed');
		});
	});
});
