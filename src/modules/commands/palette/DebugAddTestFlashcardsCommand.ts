import { BaseCommand } from '@/modules/commands/BaseCommand';
import { IndexKey } from '@/types/indexes';
import { WriterKey } from '@/types/writers';
import { AdapterKey } from '@/types/adapters';
import { CardStatus, FlashcardMetadataSchema, type Flashcard } from '@/schemas';
import type { FlashcardMetadata } from '@/schemas';
import type { SettingsAdapter } from '@/modules/adapters/SettingsAdapter';
import { Notice } from 'obsidian';
import { env } from '@/env';
import { v4 as uuid } from 'uuid';
import { State } from 'ts-fsrs';

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomSubset<T>(arr: T[], maxSize: number): T[] {
	const shuffled = [...arr];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = randomInt(0, i);
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled.slice(0, randomInt(0, maxSize));
}

function weightedRandom<T>(options: { value: T; weight: number }[]): T {
	const total = options.reduce((sum, o) => sum + o.weight, 0);
	let r = Math.random() * total;
	for (const opt of options) {
		r -= opt.weight;
		if (r <= 0) return opt.value;
	}
	return options[options.length - 1].value;
}

// ── Question templates ───────────────────────────────────────────────────────

const TEST_QUESTIONS: { front: string; back: string }[] = [
	{ front: 'What is the capital of France?', back: 'Paris' },
	{ front: 'What is 2 + 2?', back: '4' },
	{ front: 'What is the chemical symbol for water?', back: 'H₂O' },
	{ front: 'Who wrote "Romeo and Juliet"?', back: 'William Shakespeare' },
	{ front: 'What is the speed of light?', back: '~3.00 × 10⁸ m/s' },
	{ front: 'What is the largest planet in our solar system?', back: 'Jupiter' },
	{ front: 'In what year did World War II end?', back: '1945' },
	{ front: 'What does CPU stand for?', back: 'Central Processing Unit' },
	{ front: 'What is the powerhouse of the cell?', back: 'Mitochondria' },
	{ front: 'What language is this plugin written in?', back: 'TypeScript' },
	{ front: 'What is the Pythagorean theorem?', back: 'a² + b² = c²' },
	{ front: 'What element has atomic number 1?', back: 'Hydrogen' },
	{ front: 'Who painted the Mona Lisa?', back: 'Leonardo da Vinci' },
	{ front: 'What is the boiling point of water in °C?', back: '100°C' },
	{ front: 'What does HTTP stand for?', back: 'HyperText Transfer Protocol' },
	{ front: 'What is the derivative of x²?', back: '2x' },
	{ front: 'What is the SI unit of force?', back: 'Newton (N)' },
	{ front: 'What continent is Kenya in?', back: 'Africa' },
	{ front: 'What does JSON stand for?', back: 'JavaScript Object Notation' },
	{ front: 'What does FSRS stand for?', back: 'Free Spaced Repetition Scheduler' },
];

function buildShuffledCards(): { front: string; back: string }[] {
	const cards: { front: string; back: string }[] = [];
	while (cards.length < 50) {
		cards.push(...TEST_QUESTIONS);
	}
	const result = cards.slice(0, 50);
	// Fisher-Yates shuffle
	for (let i = result.length - 1; i > 0; i--) {
		const j = randomInt(0, i);
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

// ── Command ──────────────────────────────────────────────────────────────────

export class DebugAddTestFlashcardCommand extends BaseCommand {
	readonly id = 'debug-add-test-flashcards';
	readonly name = 'Generate 50 test flashcards [DEBUG]';

	protected onRegister(): void {
		if (env.mode === 'production') {
			return;
		}
		this.plugin.addCommand({
			id: this.id,
			name: this.name,
			callback: async () => {
				await this.execute();
			},
		});
	}

	private async execute(): Promise<void> {
		const writer = this.writers.get(WriterKey.flashcard);
		const indexer = this.indexes.get(IndexKey.flashcard);
		const settingsAdapter = this.adapters.get(AdapterKey.settings);

		if (!writer || !indexer || !settingsAdapter) {
			new Notice('Error: Flashcard dependencies not found');
			return;
		}

		const dir = (settingsAdapter as SettingsAdapter).data.flashcard.watch.directory;
		const now = new Date().toISOString();

		const dayMs = 86400000;
		const questions = buildShuffledCards();

		try {
			for (const question of questions) {
				const entity: Flashcard = {
					uuid: uuid(),
					source: null,
					status: Math.random() < 0.95 ? CardStatus.ACTIVE : CardStatus.PAUSED,
					decks: randomSubset(['math', 'language', 'science', 'history', 'programming'], 3),
					front: question.front,
					back: question.back,
					stability: Math.random() * 10,
					difficulty: Math.random() * 10,
					scheduled_days: randomInt(0, 30),
					learning_steps: randomInt(0, 5),
					reps: randomInt(0, 50),
					lapses: randomInt(0, 10),
					state: weightedRandom([
						{ value: State.New, weight: 0.35 },
						{ value: State.Learning, weight: 0.15 },
						{ value: State.Review, weight: 0.35 },
						{ value: State.Relearning, weight: 0.15 },
					]),
					last_review:
						Math.random() < 0.4
							? null
							: new Date(Date.now() - randomInt(0, 14) * dayMs).toISOString(),
					due: new Date(Date.now() + randomInt(-30, 30) * dayMs).toISOString(),
				};

				const filepath = `${dir}/${entity.uuid}.md`;
				await writer.create(filepath, entity);

				const {
					uuid: yUuid,
					source: ySource,
					status: yStatus,
					decks: yDecks,
					stability: yStability,
					difficulty: yDifficulty,
					scheduled_days: yScheduledDays,
					learning_steps: yLearningSteps,
					reps: yReps,
					lapses: yLapses,
					state: yState,
					last_review: yLastReview,
					due: yDue,
				} = entity;

				const metadata: FlashcardMetadata = FlashcardMetadataSchema.parse({
					uuid: yUuid,
					source: ySource,
					status: yStatus,
					decks: yDecks,
					stability: yStability,
					difficulty: yDifficulty,
					scheduled_days: yScheduledDays,
					learning_steps: yLearningSteps,
					reps: yReps,
					lapses: yLapses,
					state: yState,
					last_review: yLastReview,
					due: yDue,
					file: filepath,
					created_at: now,
					updated_at: now,
					deleted_at: null,
				});

				indexer.upsert(entity.uuid, metadata);
			}

			await indexer.save();
			new Notice('Added 50 test flashcards');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			new Notice(`Error adding test flashcards: ${message}`);
			console.error('DebugAddTestFlashcardCommand error:', error);
		}
	}
}
