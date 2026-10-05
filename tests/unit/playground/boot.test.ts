import { describe, expect, it, vi } from 'vitest';
import { parseYaml } from 'obsidian';
import { statsStore } from '@/ui/store/stats.store';
import { bootPlayground } from '../../../playground/boot';
import { FIXTURES } from '../../../playground/fixtures';
import { parseYaml as playgroundParseYaml } from '../../../playground/obsidian/index';

vi.mocked(parseYaml).mockImplementation((yaml: string) => playgroundParseYaml(yaml));

describe('playground boot', () => {
	it('publishes the initialization events in main.ts order and populates dashboard stats', async () => {
		const stack = await bootPlayground(FIXTURES.mixed);
		// The index-init handler publishes the statistics compute without awaiting it.
		await new Promise((resolve) => setTimeout(resolve, 20));

		try {
			expect(stack.settings.initialized).toBe(true);
			expect(stack.statistics.initialized).toBe(true);
			expect(stack.flashcardAdapter.initialized).toBe(true);
			expect(stack.indexer.initialized).toBe(true);

			expect(stack.indexer.size).toBe(FIXTURES.mixed.expectedCards);
			expect(stack.statistics.data.flashcard.total_cards).toBe(
				FIXTURES.mixed.expectedActiveCards,
			);
			expect(statsStore.state.flashcard.total_cards).toBe(
				FIXTURES.mixed.expectedActiveCards,
			);
		} finally {
			stack.dispose();
		}
	});
});
