import type { RealStackFixture } from '../../tests/helpers/real-vault';

/**
 * Fixture cards are authored as flat-frontmatter markdown because the in-memory
 * host parses frontmatter with `processFrontMatter`. Values must be JSON scalars
 * (quoted strings, JSON arrays, numbers, booleans, `null`) — the same flat shape
 * the performance fixtures use.
 */

export const CARD_MARKER = '?';

export type FixtureCardType = 'basic' | 'sequence' | 'quiz' | 'cloze' | 'occlusion';
export type FixtureCardStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'STALE';

export interface FixtureCard {
	path: string;
	uuid: string;
	type: FixtureCardType;
	decks: string[];
	due: string;
	body: string;
	source?: string | null;
	status?: FixtureCardStatus;
	difficulty?: number;
}

export interface FixtureOcclusionMask {
	id: string;
	rect: [number, number, number, number];
	answer: string;
	hint?: string | null;
}

export function uuidFor(seed: number): string {
	return `00000000-0000-4000-8000-${seed.toString(16).padStart(12, '0')}`;
}

export function minutesFromNow(minutes: number): string {
	return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function daysFromNow(days: number): string {
	return minutesFromNow(days * 24 * 60);
}

export function basicBody(front: string, back: string): string {
	return `${front}\n\n${CARD_MARKER}\n\n${back}`;
}

export function clozeBody(text: string): string {
	return text;
}

export function quizBody(question: string, options: { text: string; correct?: boolean }[]): string {
	const list = options
		.map((option) => `- [${option.correct ? 'x' : ' '}] ${option.text}`)
		.join('\n');
	return `${question}\n\n${CARD_MARKER}\n\n${list}`;
}

export function sequenceBody(question: string, steps: string[]): string {
	const list = steps.map((step) => `- ${step}`).join('\n');
	return `${question}\n\n${CARD_MARKER}\n\n${list}`;
}

export function occlusionBody(
	image: string,
	masks: FixtureOcclusionMask[],
	dimensions: { width: number; height: number } = { width: 320, height: 180 },
): string {
	// JSON is a YAML subset; the playground host parses the fence as JSON.
	const block = JSON.stringify({ ...dimensions, masks });
	return `![[${image}]]\n\n\`\`\`occlusion\n${block}\n\`\`\``;
}

export function cardMarkdown(card: FixtureCard): string {
	const frontmatter = [
		'---',
		`uuid: ${JSON.stringify(card.uuid)}`,
		`source: ${card.source ? JSON.stringify(card.source) : 'null'}`,
		`status: ${card.status ?? 'ACTIVE'}`,
		`decks: ${JSON.stringify(card.decks)}`,
		`card_type: ${card.type}`,
		'stability: 0',
		`difficulty: ${card.difficulty ?? 0}`,
		'scheduled_days: 0',
		'learning_steps: 0',
		'reps: 0',
		'lapses: 0',
		'state: 0',
		'last_review: null',
		`due: ${JSON.stringify(card.due)}`,
		'---',
	];
	return [...frontmatter, card.body].join('\n');
}

/** Builds a fixture from cards plus extra vault files (source notes, images). */
export function cardsFixture(
	cards: FixtureCard[],
	extra: {
		files?: [string, string][];
		settings?: RealStackFixture['settings'];
		statistics?: RealStackFixture['statistics'];
		fileStats?: RealStackFixture['fileStats'];
	} = {},
): RealStackFixture {
	const files = new Map<string, string>();
	for (const card of cards) files.set(card.path, cardMarkdown(card));
	for (const [path, content] of extra.files ?? []) files.set(path, content);
	return {
		files,
		dirPath: '/flashcards',
		settings: extra.settings,
		statistics: extra.statistics,
		fileStats: extra.fileStats,
	};
}

export const DIAGRAM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="320" height="180">
	<rect width="320" height="180" fill="#f4f1ff"/>
	<circle cx="90" cy="90" r="46" fill="#7852ee" opacity="0.85"/>
	<rect x="180" y="44" width="92" height="92" rx="12" fill="#d53984" opacity="0.85"/>
	<text x="160" y="168" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#2e3338">occlusion fixture diagram</text>
</svg>
`;
