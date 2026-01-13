import { IIndexManager } from '@/core/indexer/contracts/IIndexManager';
import { VaultWatcher } from '@/obsidian/VaultWatcher';
import { IVaultWatcherConfig } from '@/obsidian/contracts/IVaultWatcher';
import { TFile, Vault } from 'obsidian';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Vault Integration', () => {
	let vaultWatcher: VaultWatcher;
	let mockApp: any;
	let mockIndexManager: any;
	let mockConfig: IVaultWatcherConfig;
	let vaultEvents: Record<string, any> = {};

	beforeEach(() => {
		vaultEvents = {};
		mockApp = {
			vault: {
				on: vi.fn((event: string, callback: any) => {
					vaultEvents[event] = callback;
				}),
				read: vi.fn(),
				adapter: {
					exists: vi.fn(),
					read: vi.fn(),
				},
			},
		};

		mockIndexManager = {
			findCardsBySource: vi.fn(),
			upsertCard: vi.fn(),
			save: vi.fn(),
		} as unknown as IIndexManager;

		mockConfig = {
			watchDirectories: ['/'],
			watchTags: [],
			ignoredDirectories: ['.obsidian'],
			debounceTimeoutMs: 100,
			enableSoftDelete: true,
			softDeleteHours: 24,
		};

		vaultWatcher = new VaultWatcher(mockApp, mockIndexManager, mockConfig);

		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Bulk Rename Processing', () => {
		it('should handle bulk rename of multiple files in a single batch', async () => {
			await vaultWatcher.initialize();

			const numFiles = 50;
			const oldPathPrefix = 'folder/note-';
			const newPathPrefix = 'new-folder/renamed-note-';

			mockIndexManager.findCardsBySource.mockImplementation((path: string) => {
				if (path.startsWith(oldPathPrefix)) {
					return [{ file: `${path}.card.md`, source: path }];
				}
				return [];
			});

			for (let i = 0; i < numFiles; i++) {
				const mockFile: TFile = {
					basename: `renamed-note-${i}`,
					extension: 'md',
					name: `renamed-note-${i}.md`,
					parent: null,
					path: `${newPathPrefix}${i}.md`,
					stat: { ctime: Date.now(), mtime: Date.now(), size: 100 },
					vault: {} as Vault,
				};

				vaultEvents['rename'](mockFile, `${oldPathPrefix}${i}.md`);
			}

			vi.advanceTimersByTime(100);
			await vi.runAllTimersAsync();

			expect(mockIndexManager.findCardsBySource).toHaveBeenCalledTimes(numFiles);
			expect(mockIndexManager.upsertCard).toHaveBeenCalledTimes(numFiles);
			expect(mockIndexManager.save).toHaveBeenCalled();

			for (let i = 0; i < numFiles; i++) {
				const oldPath = `${oldPathPrefix}${i}.md`;
				const newPath = `${newPathPrefix}${i}.md`;

				const findCardsCalls = mockIndexManager.findCardsBySource.mock.calls;
				const findCall = findCardsCalls.find((call: any[]) => call[0] === oldPath);
				expect(findCall).toBeDefined();

				const upsertCalls = mockIndexManager.upsertCard.mock.calls;
				const upsertCall = upsertCalls.some((call: any[]) => call[1] && call[1].source === newPath);
				expect(upsertCall).toBe(true);
			}
		});

		it('should correctly update source links for all affected cards during bulk rename', async () => {
			await vaultWatcher.initialize();

			const oldPath = 'folder/source-note.md';
			const newPath = 'new-folder/renamed-note.md';
			const cardsCount = 10;

			mockIndexManager.findCardsBySource.mockReturnValue(
				Array.from({ length: cardsCount }, (_, i) => ({
					file: `card-${i}.md`,
					source: oldPath,
				})),
			);

			const mockFile: TFile = {
				basename: 'renamed-note',
				extension: 'md',
				name: 'renamed-note.md',
				parent: null,
				path: newPath,
				stat: { ctime: Date.now(), mtime: Date.now(), size: 100 },
				vault: {} as Vault,
			};

			vaultEvents['rename'](mockFile, oldPath);

			vi.advanceTimersByTime(100);
			await vi.runAllTimersAsync();

			expect(mockIndexManager.findCardsBySource).toHaveBeenCalledWith(oldPath);
			expect(mockIndexManager.upsertCard).toHaveBeenCalledTimes(cardsCount);

			for (let i = 0; i < cardsCount; i++) {
				const upsertCall = mockIndexManager.upsertCard.mock.calls[i];
				expect(upsertCall[1]).toEqual({
					source: newPath,
					updated: expect.any(String),
				});
			}
		});
	});

	describe('Debounced Batch Processing', () => {
		it('should batch process multiple rapid events within debounce window', async () => {
			await vaultWatcher.initialize();

			mockIndexManager.findCardsBySource.mockReturnValue([{ file: 'card1.md', source: 'note.md' }]);

			const mockFiles: TFile[] = Array.from({ length: 10 }, (_, i) => ({
				basename: `note-${i}`,
				extension: 'md',
				name: `note-${i}.md`,
				parent: null,
				path: `note-${i}.md`,
				stat: { ctime: Date.now(), mtime: Date.now(), size: 100 },
				vault: {} as Vault,
			}));

			mockFiles.forEach((file) => vaultEvents['modify'](file));

			vi.advanceTimersByTime(50);
			expect(mockIndexManager.findCardsBySource).not.toHaveBeenCalled();

			vi.advanceTimersByTime(50);
			await vi.runAllTimersAsync();

			expect(mockIndexManager.findCardsBySource).toHaveBeenCalledTimes(10);
			expect(mockIndexManager.upsertCard).toHaveBeenCalledTimes(10);
		});

		it('should reset debounce timer on each new event', async () => {
			await vaultWatcher.initialize();

			mockIndexManager.findCardsBySource.mockReturnValue([{ file: 'card1.md', source: 'note.md' }]);

			const mockFile: TFile = {
				basename: 'note',
				extension: 'md',
				name: 'note.md',
				parent: null,
				path: 'note.md',
				stat: { ctime: Date.now(), mtime: Date.now(), size: 100 },
				vault: {} as Vault,
			};

			vaultEvents['modify'](mockFile);
			vi.advanceTimersByTime(50);

			vaultEvents['modify'](mockFile);
			vi.advanceTimersByTime(50);

			vaultEvents['modify'](mockFile);
			vi.advanceTimersByTime(50);

			expect(mockIndexManager.findCardsBySource).not.toHaveBeenCalled();

			vi.advanceTimersByTime(50);
			await vi.runAllTimersAsync();

			expect(mockIndexManager.findCardsBySource).toHaveBeenCalled();
			expect(mockIndexManager.save).toHaveBeenCalled();
		});

		it('should process all events in batch after debounce timeout', async () => {
			await vaultWatcher.initialize();

			const mockFiles: TFile[] = Array.from({ length: 5 }, (_, i) => ({
				basename: `note-${i}`,
				extension: 'md',
				name: `note-${i}.md`,
				parent: null,
				path: `note-${i}.md`,
				stat: { ctime: Date.now(), mtime: Date.now(), size: 100 },
				vault: {} as Vault,
			}));

			mockIndexManager.findCardsBySource.mockImplementation((path: string) => [
				{ file: `${path}.card.md`, source: path },
			]);

			mockFiles.forEach((file) => vaultEvents['modify'](file));

			vi.advanceTimersByTime(100);
			await vi.runAllTimersAsync();

			expect(mockIndexManager.findCardsBySource).toHaveBeenCalledTimes(5);
			expect(mockIndexManager.upsertCard).toHaveBeenCalledTimes(5);
			expect(mockIndexManager.save).toHaveBeenCalled();

			for (let i = 0; i < 5; i++) {
				const call = mockIndexManager.findCardsBySource.mock.calls[i];
				expect(call[0]).toBe(`note-${i}.md`);
			}
		});
	});
});
