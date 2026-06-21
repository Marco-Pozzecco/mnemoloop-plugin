import { DebugAddTestFlashcardCommand } from '@/modules/commands/palette/DebugAddTestFlashcardsCommand';
import { IndexKey } from '@/types/indexes';
import { WriterKey } from '@/types/writers';
import { AdapterKey } from '@/types/adapters';
import { Notice } from 'obsidian';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlugin } from '../../../../helpers/mock-obsidian';

vi.mock('uuid', () => {
	let counter = 0;
	return {
		v4: vi.fn().mockImplementation(() => {
			const n = String(counter++).padStart(12, '0');
			return `00000000-0000-4000-8000-${n}`;
		}),
	};
});

describe('DebugAddTestFlashcardCommand', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	function setup() {
		const cmd = new DebugAddTestFlashcardCommand();
		const plugin = createMockPlugin();
		const addCommandSpy = vi.spyOn(plugin, 'addCommand');
		return { cmd, plugin, addCommandSpy };
	}

	it('registers command with correct id and name', () => {
		const { cmd, plugin, addCommandSpy } = setup();

		cmd.register({
			plugin: plugin as never,
			adapters: new Map(),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map(),
		});

		expect(addCommandSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 'debug-add-test-flashcards',
				name: 'Generate 50 test flashcards [DEBUG]',
			}),
		);
	});

	it('shows error Notice when writer missing', async () => {
		const { cmd, plugin, addCommandSpy } = setup();

		cmd.register({
			plugin: plugin as never,
			adapters: new Map(),
			indexes: new Map([[IndexKey.flashcard, {}]]) as never,
			parsers: new Map(),
			writers: new Map(),
		});

		const callback = (addCommandSpy.mock.calls[0][0] as { callback: () => unknown }).callback;
		await callback();

		expect(Notice).toHaveBeenCalledWith('Error: Flashcard dependencies not found');
	});

	it('shows error Notice when indexer missing', async () => {
		const { cmd, plugin, addCommandSpy } = setup();

		cmd.register({
			plugin: plugin as never,
			adapters: new Map(),
			indexes: new Map(),
			parsers: new Map(),
			writers: new Map([[WriterKey.flashcard, {}]]) as never,
		});

		const callback = (addCommandSpy.mock.calls[0][0] as { callback: () => unknown }).callback;
		await callback();

		expect(Notice).toHaveBeenCalledWith('Error: Flashcard dependencies not found');
	});

	it('shows error Notice when settings adapter missing', async () => {
		const { cmd, plugin, addCommandSpy } = setup();

		cmd.register({
			plugin: plugin as never,
			adapters: new Map(),
			indexes: new Map([[IndexKey.flashcard, {}]]) as never,
			parsers: new Map(),
			writers: new Map([[WriterKey.flashcard, {}]]) as never,
		});

		const callback = (addCommandSpy.mock.calls[0][0] as { callback: () => unknown }).callback;
		await callback();

		expect(Notice).toHaveBeenCalledWith('Error: Flashcard dependencies not found');
	});

	it('creates 50 flashcards and shows success Notice', async () => {
		const { cmd, plugin, addCommandSpy } = setup();

		const mockWriter = {
			create: vi.fn().mockResolvedValue(undefined),
		};
		const mockIndexer = {
			upsert: vi.fn(),
			save: vi.fn().mockResolvedValue(undefined),
		};
		const mockSettings = {
			data: {
				flashcard: {
					watch: {
						directory: '/test-dir',
					},
				},
			},
		};

		cmd.register({
			plugin: plugin as never,
			adapters: new Map([[AdapterKey.settings, mockSettings]]) as never,
			indexes: new Map([[IndexKey.flashcard, mockIndexer]]) as never,
			parsers: new Map(),
			writers: new Map([[WriterKey.flashcard, mockWriter]]) as never,
		});

		const callback = (addCommandSpy.mock.calls[0][0] as { callback: () => unknown }).callback;
		await callback();

		expect(mockWriter.create).toHaveBeenCalledTimes(50);
		expect(mockIndexer.upsert).toHaveBeenCalledTimes(50);
		expect(mockIndexer.save).toHaveBeenCalledTimes(1);
		expect(Notice).toHaveBeenCalledWith('Added 50 test flashcards');
	});

	it('randomized due dates span at least 7 days', async () => {
		const { cmd, plugin, addCommandSpy } = setup();

		const mockWriter = {
			create: vi.fn().mockResolvedValue(undefined),
		};
		const mockIndexer = {
			upsert: vi.fn(),
			save: vi.fn().mockResolvedValue(undefined),
		};
		const mockSettings = {
			data: {
				flashcard: {
					watch: {
						directory: '/test-dir',
					},
				},
			},
		};

		cmd.register({
			plugin: plugin as never,
			adapters: new Map([[AdapterKey.settings, mockSettings]]) as never,
			indexes: new Map([[IndexKey.flashcard, mockIndexer]]) as never,
			parsers: new Map(),
			writers: new Map([[WriterKey.flashcard, mockWriter]]) as never,
		});

		const callback = (addCommandSpy.mock.calls[0][0] as { callback: () => unknown }).callback;
		await callback();

		const dueDates: number[] = mockWriter.create.mock.calls.map(
			(call: [string, { due: string }]) => new Date(call[1].due).getTime(),
		);
		const range = Math.max(...dueDates) - Math.min(...dueDates);
		expect(range).toBeGreaterThanOrEqual(7 * 86400000);
	});
});
