import {
	buildRealStack,
	type RealStack,
	type RealStackFixture,
} from '../../helpers/real-stack';
import type { PerfCard, PerfFixture } from './fixture';

/**
 * Performance-test entry point over the shared stack builder. The real wiring
 * lives in `tests/helpers/real-stack.ts` so the playground boots the same graph.
 */

export type PerfStack = RealStack;

function seededIndex(fixture: PerfFixture): string {
	const now = new Date().toISOString();
	return JSON.stringify({
		flashcards: fixture.cards.map((card: PerfCard) => ({
			uuid: card.uuid,
			source: null,
			status: 'ACTIVE',
			decks: [`deck-${parseInt(card.uuid.slice(-2), 16) % 20}`],
			card_type: 'basic',
			stability: 0,
			difficulty: 0,
			scheduled_days: 0,
			learning_steps: 0,
			reps: 0,
			lapses: 0,
			state: 0,
			last_review: null,
			due: card.due,
			file: card.path,
			created_at: now,
			updated_at: now,
		})),
		updated_at: now,
	});
}

export async function buildPerfStack(
	fixture: PerfFixture,
	opts: { seedIndex?: boolean; ioLatencyMs?: number } = {},
): Promise<RealStack> {
	const stackFixture: RealStackFixture = {
		files: fixture.files,
		dirPath: fixture.dirPath,
		indexJson: opts.seedIndex ? (fixture.indexJson ?? seededIndex(fixture)) : null,
	};
	return buildRealStack(stackFixture, opts);
}
