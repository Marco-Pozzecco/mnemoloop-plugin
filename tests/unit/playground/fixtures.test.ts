import { describe, expect, it, vi } from 'vitest';
import { parseYaml } from 'obsidian';
import {
	FlashcardAdapterInitEvent,
	FlashcardIndexInitEvent,
	FlashcardStatisticsComputeEvent,
	SettingsAdapterInitEvent,
	StatisticsAdapterInitEvent,
} from '@/modules/events';
import { FIXTURES } from '../../../playground/fixtures';
import { basicBody, cardsFixture, uuidFor } from '../../../playground/fixtures/cards';
import { parseYaml as playgroundParseYaml } from '../../../playground/obsidian/index';
import { buildRealStack, type RealStackFixture } from '../../helpers/real-stack';

// The shared fixture host serializes occlusion blocks as JSON; the Obsidian
// mock's default parseYaml returns an empty object, so align it with the
// playground's parser to boot the same fixtures the browser boots.
vi.mocked(parseYaml).mockImplementation((yaml: string) => playgroundParseYaml(yaml));

async function bootFixture(documents: RealStackFixture) {
	const stack = await buildRealStack(documents);
	await stack.bus.publish(new FlashcardAdapterInitEvent());
	await stack.bus.publish(new SettingsAdapterInitEvent());
	await stack.bus.publish(new StatisticsAdapterInitEvent());
	await stack.bus.publish(new FlashcardIndexInitEvent());
	await stack.bus.publish(new FlashcardStatisticsComputeEvent());
	return stack;
}

function cardPaths(documents: RealStackFixture): string[] {
	const dirPath = documents.dirPath ?? '/flashcards';
	return [...documents.files.keys()].filter(
		(path) => path.startsWith(`${dirPath}/`) && path.endsWith('.md'),
	);
}

describe('playground fixtures', () => {
	for (const [name, fixture] of Object.entries(FIXTURES)) {
		it(`boots "${name}" through the real stack`, async () => {
			const errors: unknown[] = [];
			const originalError = console.error;
			console.error = (...args: unknown[]) => {
				errors.push(args);
			};

			let stack: Awaited<ReturnType<typeof bootFixture>> | undefined;
			try {
				stack = await bootFixture(fixture.documents);
			} finally {
				console.error = originalError;
			}

			try {
				expect(errors).toEqual([]);
				expect(stack!.indexer.size).toBe(fixture.expectedCards);
				expect(stack!.statistics.data.flashcard.total_cards).toBe(
					fixture.expectedActiveCards,
				);

				// Indexing only reads frontmatter; fully parse every card so a
				// corrupted body fails the fixture here instead of during review.
				for (const path of cardPaths(fixture.documents)) {
					const parsed = await stack!.parser.parseFile(path);
					expect(parsed.success, `fixture card parses: ${path}`).toBe(true);
				}
			} finally {
				stack?.dispose();
			}
		});
	}

	it('skips a malformed card without throwing', async () => {
		const documents = cardsFixture([
			{
				path: '/flashcards/valid.md',
				uuid: uuidFor(900),
				type: 'basic',
				decks: ['Core'],
				due: new Date(Date.now() - 60_000).toISOString(),
				body: basicBody('Valid question', 'Valid answer'),
			},
		]);
		documents.files.set(
			'/flashcards/broken.md',
			['---', 'card_type: future-type', '---', 'not a card'].join('\n'),
		);

		const stack = await bootFixture(documents);
		try {
			expect(stack.indexer.size).toBe(1);
		} finally {
			stack.dispose();
		}
	});
});
