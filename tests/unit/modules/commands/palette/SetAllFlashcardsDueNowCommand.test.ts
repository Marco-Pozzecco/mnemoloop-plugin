import { SetAllFlashcardsDueNowCommand } from '@/modules/commands/palette/SetAllFlashcardsDueNowCommand';
import { IndexKey } from '@/types/indexes';
import { ParserKey } from '@/types/parsers';
import { WriterKey } from '@/types/writers';
import { Notice } from 'obsidian';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlugin } from '../../../../helpers/mock-obsidian';
import { FlashcardIndexer } from '@/modules/indexers/FlashcardIndexer';
import { FlashcardParser } from '@/modules/parsers/entity/FlashcardParser';
import { FlashcardWriter } from '@/modules/writers/FlashcardWriter';

vi.mock('@/modules/writers/FlashcardWriter', () => ({
	FlashcardWriter: vi.fn().mockImplementation(() => ({
		updateFrontmatter: vi.fn().mockResolvedValue(undefined),
	})),
}));

describe('SetAllFlashcardsDueNowCommand', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	function setup() {
		const cmd = new SetAllFlashcardsDueNowCommand();
		const plugin = createMockPlugin();
		const addCommandSpy = vi.spyOn(plugin, 'addCommand');
		return { cmd, plugin, addCommandSpy };
	}

	it('should register command with correct id and name', () => {
		const { cmd, plugin, addCommandSpy } = setup();
		cmd.register({
			plugin: plugin as any,
			adapters: new Map() as any,
			indexes: new Map() as any,
			parsers: new Map() as any,
			writers: new Map() as any,
		});

		expect(addCommandSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 'set-all-flashcards-due-now',
				name: 'Set all flashcards due to now [DEBUG]',
			}),
		);
	});

	it('should show Notice when indexer not found', async () => {
		const { cmd, plugin, addCommandSpy } = setup();
		cmd.register({
			plugin: plugin as any,
			adapters: new Map() as any,
			indexes: new Map() as any,
			parsers: new Map() as any,
			writers: new Map() as any,
		});

		const callback = (addCommandSpy.mock.calls[0][0] as { callback: () => unknown }).callback;
		await callback();

		expect(Notice).toHaveBeenCalledWith('Error: Flashcard dependencies not found');
	});

	it('should show Notice when parser not found', async () => {
		const { cmd, plugin, addCommandSpy } = setup();
		const mockIndex = { getAll: vi.fn().mockReturnValue([]), update: vi.fn(), save: vi.fn() };

		cmd.register({
			plugin: plugin as any,
			adapters: new Map() as any,
			indexes: new Map([[IndexKey.flashcard, mockIndex]]) as any,
			parsers: new Map() as any,
			writers: new Map() as any,
		});

		const callback = (addCommandSpy.mock.calls[0][0] as { callback: () => unknown }).callback;
		await callback();

		expect(Notice).toHaveBeenCalledWith('Error: Flashcard dependencies not found');
	});

	it('should show Notice when no flashcards found', async () => {
		const { cmd, plugin, addCommandSpy } = setup();
		const mockIndex = { getAll: vi.fn().mockReturnValue([]), update: vi.fn(), save: vi.fn() };
		const mockParser = { parse: vi.fn() };
		const mockWriter = { updateFrontmatter: vi.fn().mockResolvedValue(undefined) };

		cmd.register({
			plugin: plugin,
			adapters: new Map(),
			indexes: new Map([[IndexKey.flashcard, mockIndex as unknown as FlashcardIndexer]]),
			parsers: new Map([[ParserKey.flashcard, mockParser as unknown as FlashcardParser]]),
			writers: new Map([[WriterKey.flashcard, mockWriter as unknown as FlashcardWriter]]),
		});

		const callback = (addCommandSpy.mock.calls[0][0] as { callback: () => unknown }).callback;
		await callback();

		expect(Notice).toHaveBeenCalledWith('No flashcards found');
	});
	it('should update all flashcards and show success Notice', async () => {
		const { cmd, plugin, addCommandSpy } = setup();
		const flashcards = [
			{ uuid: 'fc-1', file: 'flashcards/fc-1.md' },
			{ uuid: 'fc-2', file: 'flashcards/fc-2.md' },
		];
		const mockIndex = {
			getAll: vi.fn().mockReturnValue(flashcards),
			save: vi.fn().mockResolvedValue(undefined),
		};
		const mockParser = { parse: vi.fn() };
		const mockWriter = { updateFrontmatter: vi.fn().mockResolvedValue(undefined) };

		cmd.register({
			plugin: plugin,
			adapters: new Map(),
			indexes: new Map([[IndexKey.flashcard, mockIndex as unknown as FlashcardIndexer]]),
			parsers: new Map([[ParserKey.flashcard, mockParser as unknown as FlashcardParser]]),
			writers: new Map([[WriterKey.flashcard, mockWriter as unknown as FlashcardWriter]]),
		});

		const callback = (addCommandSpy.mock.calls[0][0] as { callback: () => unknown }).callback;
		await callback();

		expect(mockIndex.getAll).toHaveBeenCalledTimes(1);
		expect(mockIndex.save).toHaveBeenCalledTimes(1);
		expect(mockWriter.updateFrontmatter).toHaveBeenCalledTimes(2);
		expect(Notice).toHaveBeenCalledWith('Updated 2 flashcard(s) due date to now');
	});
});
