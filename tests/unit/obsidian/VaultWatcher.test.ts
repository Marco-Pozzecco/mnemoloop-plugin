import { vi } from 'vitest';

import { VaultWatcher } from '@/obsidian/VaultWatcher';
import { IVaultWatcherConfig } from '@/obsidian/contracts/IVaultWatcher';
import { TFile, Vault } from 'obsidian';
import { beforeEach, describe, expect, it, afterEach } from 'vitest';

describe('VaultWatcher', () => {
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
		};

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

	it('should register vault events on initialize', async () => {
		await vaultWatcher.initialize();
		expect(mockApp.vault.on).toHaveBeenCalledWith('modify', expect.any(Function));
		expect(mockApp.vault.on).toHaveBeenCalledWith('delete', expect.any(Function));
		expect(mockApp.vault.on).toHaveBeenCalledWith('rename', expect.any(Function));
	});

	it('should handle modify events and mark cards as stale', async () => {
		await vaultWatcher.initialize();

		const mockFile: TFile = {
			basename: 'test',
			extension: 'md',
			name: 'test.md',
			parent: null,
			path: 'test.md',
			stat: { ctime: new Date().getTime(), mtime: new Date().getTime(), size: 100 },
			vault: {} as Vault,
		};

		mockIndexManager.findCardsBySource.mockReturnValue([
			{ file: 'card1.md', source: 'test.md' },
			{ file: 'card2.md', source: 'test.md' },
		]);

		// Trigger modify event
		vaultEvents['modify'](mockFile);

		// Advance timers for EventQueue
		vi.advanceTimersByTime(100);
		await vi.runAllTimersAsync();

		expect(mockIndexManager.findCardsBySource).toHaveBeenCalledWith('test.md');
		expect(mockIndexManager.upsertCard).toHaveBeenCalledTimes(2);
		expect(mockIndexManager.upsertCard).toHaveBeenCalledWith(expect.any(String), {
			status: 'STALE',
		});
		expect(mockIndexManager.save).toHaveBeenCalled();
	});

	it('should filter events based on ignored directories', async () => {
		await vaultWatcher.initialize();

		const mockFile: TFile = {
			basename: 'test',
			extension: 'md',
			name: 'test.md',
			parent: null,
			path: '.obsidian/test.md',
			stat: { ctime: new Date().getTime(), mtime: new Date().getTime(), size: 100 },
			vault: {} as Vault,
		};

		vaultEvents['modify'](mockFile);

		vi.advanceTimersByTime(100);
		await vi.runAllTimersAsync();

		expect(mockIndexManager.findCardsBySource).not.toHaveBeenCalled();
	});

	it('should handle rename events and update source references', async () => {
		await vaultWatcher.initialize();

		const mockFile: TFile = {
			basename: 'new-path',
			extension: 'md',
			name: 'new-path.md',
			parent: null,
			path: 'new-path.md',
			stat: { ctime: new Date().getTime(), mtime: new Date().getTime(), size: 100 },
			vault: {} as Vault,
		};

		mockIndexManager.findCardsBySource.mockReturnValue([
			{ file: 'card1.md', source: 'old-path.md' },
		]);

		// Trigger rename event
		vaultEvents['rename'](mockFile, 'old-path.md');

		vi.advanceTimersByTime(100);
		await vi.runAllTimersAsync();

		expect(mockIndexManager.findCardsBySource).toHaveBeenCalledWith('old-path.md');
		expect(mockIndexManager.upsertCard).toHaveBeenCalledWith(expect.any(String), {
			source: 'new-path.md',
			updated: expect.any(String),
		});
	});
});
