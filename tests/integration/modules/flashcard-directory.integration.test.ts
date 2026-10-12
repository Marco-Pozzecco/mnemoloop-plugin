import { describe, expect, it, vi } from 'vitest';
import { FlashcardWriterCreateRequestEvent } from '@/modules/events/domains/flashcard/writer';
import { SettingsAdapterInitEvent } from '@/modules/events/domains/settings/adapter';
import { CardType } from '@/schemas';
import { buildRealStack, type RealStackFixture } from '../../helpers/real-stack';

const WATCH_DIRECTORY = '/flashcards';

function emptyVault(): RealStackFixture {
	return { files: new Map<string, string>(), dirPath: WATCH_DIRECTORY };
}

/** Drives the create request through the real event bus, handler and writer. */
async function createFlashcard(stack: Awaited<ReturnType<typeof buildRealStack>>) {
	await stack.bus.publish(new SettingsAdapterInitEvent());
	await stack.bus.publish(
		new FlashcardWriterCreateRequestEvent({
			content: { meta_type: CardType.Basic, front: 'Question', back: 'Answer' },
			source: null,
			decks: [],
		}),
	);
}

describe('flashcard directory creation on create', () => {
	it('creates a missing configured directory and writes the card', async () => {
		const stack = await buildRealStack(emptyVault(), { preCreateWatchDir: false });
		const { folders, contents } = stack.vault;
		try {
			expect(folders.has(WATCH_DIRECTORY)).toBe(false);

			await createFlashcard(stack);

			expect(folders.has(WATCH_DIRECTORY)).toBe(true);
			const written = [...contents.entries()].find(([path]) => path.endsWith('.md'));
			expect(written).toBeDefined();
			expect(written?.[1]).toContain('Question');
		} finally {
			stack.dispose();
		}
	});

	it('reuses an existing configured directory without creating it again', async () => {
		const stack = await buildRealStack(emptyVault());
		const { folders, contents, vault } = stack.vault;
		try {
			expect(folders.has(WATCH_DIRECTORY)).toBe(true);
			const createFolder = vi.spyOn(vault, 'createFolder');

			await createFlashcard(stack);

			expect(createFolder).not.toHaveBeenCalled();
			const written = [...contents.entries()].find(([path]) => path.endsWith('.md'));
			expect(written?.[1]).toContain('Question');
		} finally {
			stack.dispose();
		}
	});
});
