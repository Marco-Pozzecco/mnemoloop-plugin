import type { Stats } from '@/schemas/statistics';
import { DEFAULT_STATISTICS } from '@/schemas/statistics';
import type { RealStackFixture } from '../../tests/helpers/real-vault';
import {
	basicBody,
	cardsFixture,
	clozeBody,
	DIAGRAM_SVG,
	daysFromNow,
	minutesFromNow,
	occlusionBody,
	quizBody,
	sequenceBody,
	uuidFor,
	type FixtureCard,
} from './cards';

export interface PlaygroundFixture {
	readonly name: string;
	readonly description: string;
	readonly documents: RealStackFixture;
	readonly expectedCards: number;
	readonly expectedActiveCards: number;
}

function mixedFixture(): PlaygroundFixture {
	const cards: FixtureCard[] = [
		{
			path: '/flashcards/basic-spacing.md',
			uuid: uuidFor(1),
			type: 'basic',
			decks: ['Core'],
			due: minutesFromNow(-30),
			body: basicBody(
				'What is spaced repetition?',
				'A study method that schedules reviews at increasing intervals, timed to just before you would forget.',
			),
		},
		{
			path: '/flashcards/cloze-heart.md',
			uuid: uuidFor(2),
			type: 'cloze',
			decks: ['Science', 'Biology'],
			due: minutesFromNow(-25),
			body: clozeBody(
				'The mitral valve separates the {{c1::left atrium::chamber}} from the {{c2::left ventricle::chamber}}.',
			),
		},
		{
			path: '/flashcards/quiz-planets.md',
			uuid: uuidFor(3),
			type: 'quiz',
			decks: ['Science'],
			due: minutesFromNow(-20),
			body: quizBody('Which planet has the most confirmed moons?', [
				{ text: 'Saturn', correct: true },
				{ text: 'Jupiter' },
				{ text: 'Uranus' },
			]),
		},
		{
			path: '/flashcards/sequence-mitosis.md',
			uuid: uuidFor(4),
			type: 'sequence',
			decks: ['Science', 'Biology'],
			due: minutesFromNow(-15),
			body: sequenceBody('Order the stages of mitosis.', [
				'Prophase',
				'Metaphase',
				'Anaphase',
				'Telophase',
			]),
		},
		{
			path: '/flashcards/occlusion-diagram.md',
			uuid: uuidFor(5),
			type: 'occlusion',
			decks: ['Diagrams'],
			due: minutesFromNow(-10),
			body: occlusionBody('assets/diagram.svg', [
				{ id: 'm1', rect: [0.08, 0.12, 0.34, 0.6], answer: 'The purple circle', hint: 'Left shape' },
				{ id: 'm2', rect: [0.55, 0.15, 0.3, 0.55], answer: 'The pink square' },
			]),
		},
	];

	return {
		name: 'mixed',
		description: 'Every card type across several decks, all due now',
		documents: cardsFixture(cards, { files: [['assets/diagram.svg', DIAGRAM_SVG]] }),
		expectedCards: cards.length,
		expectedActiveCards: cards.length,
	};
}

function dueHeavyFixture(): PlaygroundFixture {
	const cards: FixtureCard[] = [];
	for (let index = 1; index <= 24; index += 1) {
		const seeded = index % 3 === 0;
		cards.push({
			path: `/flashcards/heavy-${index.toString().padStart(2, '0')}.md`,
			uuid: uuidFor(100 + index),
			type: 'basic',
			decks: index % 2 === 0 ? ['Core'] : ['Biology'],
			due: minutesFromNow(-index * 5),
			difficulty: seeded ? 8.5 : 5,
			source: seeded ? '[[notes/alpha]]' : null,
			body: basicBody(`Heavy card ${index}: what does it test?`, `Recall of item ${index}.`),
		});
	}

	const alphaNote = [
		'# Alpha signaling',
		'',
		'Alpha signaling is the worked example used for the priming flow. It reads like a source note so the reader has something to scroll.',
		'',
		'## Key claims',
		'',
		'- The pathway is activated in short bursts.',
		'- Repeated activation strengthens recall.',
		'- Sleep consolidates the trace.',
		'',
		'## Why it matters',
		'',
		'Readers should stop and reconstruct the mechanism before starting the review.',
	].join('\n');

	return {
		name: 'due-heavy',
		description: '24 due cards, eight of them priming-eligible through a source note',
		documents: cardsFixture(cards, {
			files: [
				['notes/alpha.md', alphaNote],
				['notes/beta.md', '# Beta pathway\n\nAn alternate source note that is not referenced by any card.'],
			],
		}),
		expectedCards: cards.length,
		expectedActiveCards: cards.length,
	};
}

function progressForLastDays(days: number): Stats['progress'] {
	const progress: Stats['progress'] = {};
	for (let day = 0; day < days; day += 1) {
		const date = new Date(Date.now() - day * 86_400_000).toISOString().slice(0, 10);
		const total = 12 + ((day * 5) % 18);
		const correct = Math.round(total * (0.68 + (day % 5) * 0.06));
		progress[date] = {
			total_count: total,
			correct_count: correct,
			incorrect_count: total - correct,
			retention_rate: correct / total,
			sessions_completed: 1 + (day % 3),
			total_duration: 420 + day * 30,
			goal_completed: total >= 20,
		};
	}
	return progress;
}

function analyticsFixture(): PlaygroundFixture {
	const cards: FixtureCard[] = [];
	const fileStats = new Map<string, { ctime: number }>();
	for (let index = 1; index <= 8; index += 1) {
		const path = `/flashcards/analytics-${index}.md`;
		// Spread creation dates so the cumulative chart has more than one point.
		fileStats.set(path, { ctime: Date.now() - index * 86_400_000 });
		cards.push({
			path,
			uuid: uuidFor(200 + index),
			type: index % 4 === 0 ? 'cloze' : 'basic',
			decks: index % 2 === 0 ? ['Core'] : ['Science'],
			due: daysFromNow(index - 4),
			body:
				index % 4 === 0
					? clozeBody(`Analytics cloze ${index}: {{c1::retention}} drives the forecast.`)
					: basicBody(`Analytics card ${index}`, `Answer ${index} with varying due dates.`),
		});
	}

	const statistics: Partial<Stats> = {
		progress: progressForLastDays(21),
		sessions: Array.from({ length: 6 }, (_, index) => {
			const start = Date.parse(`${new Date(Date.now() - (index + 1) * 86_400_000).toISOString().slice(0, 10)}T09:00:00.000Z`);
			const startTime = Number.isFinite(start) ? start : Date.now() - (index + 1) * 86_400_000;
			return {
				session_id: uuidFor(300 + index),
				date: new Date(startTime).toISOString().slice(0, 10),
				review_type: 'flashcard',
				start_time: startTime,
				end_time: startTime + 12 * 60_000,
				total_count: 18,
				correct_count: 14,
				incorrect_count: 4,
				duration_s: 720,
			};
		}),
		flashcard: {
			...DEFAULT_STATISTICS.flashcard,
			total_learned: 6,
			total_reviews: 108,
			retention_rate: 0.82,
			current_streak: 4,
			longest_streak: 9,
			daily_goal: 10,
		},
	};

	return {
		name: 'analytics',
		description: 'Three weeks of progress history and review sessions for the charts',
		documents: cardsFixture(cards, { statistics, fileStats }),
		expectedCards: cards.length,
		expectedActiveCards: cards.length,
	};
}

function pausedFixture(): PlaygroundFixture {
	const cards: FixtureCard[] = [
		{
			path: '/flashcards/paused-active-1.md',
			uuid: uuidFor(401),
			type: 'basic',
			decks: ['Core'],
			due: minutesFromNow(-60),
			body: basicBody('Active card one', 'Still in rotation.'),
		},
		{
			path: '/flashcards/paused-active-2.md',
			uuid: uuidFor(402),
			type: 'basic',
			decks: ['Core'],
			due: minutesFromNow(-45),
			body: basicBody('Active card two', 'Still in rotation.'),
		},
		{
			path: '/flashcards/paused-active-3.md',
			uuid: uuidFor(403),
			type: 'basic',
			decks: ['Biology'],
			due: minutesFromNow(-20),
			body: basicBody('Active card three', 'Still in rotation.'),
		},
		{
			path: '/flashcards/paused-card-1.md',
			uuid: uuidFor(404),
			type: 'basic',
			decks: ['Core'],
			status: 'PAUSED',
			due: minutesFromNow(-120),
			body: basicBody('Paused card one', 'Excluded from review until resumed.'),
		},
		{
			path: '/flashcards/paused-card-2.md',
			uuid: uuidFor(405),
			type: 'basic',
			decks: ['Biology'],
			status: 'PAUSED',
			due: minutesFromNow(-90),
			body: basicBody('Paused card two', 'Excluded from review until resumed.'),
		},
		{
			path: '/flashcards/stale-card.md',
			uuid: uuidFor(406),
			type: 'basic',
			decks: ['Core'],
			status: 'STALE',
			due: minutesFromNow(-30),
			body: basicBody('Stale card', 'Its source note changed or went missing.'),
		},
	];

	return {
		name: 'paused',
		description: 'Active, paused and stale cards for the Manage filters',
		documents: cardsFixture(cards),
		expectedCards: cards.length,
		expectedActiveCards: 3,
	};
}

function longContentFixture(): PlaygroundFixture {
	const longFront = [
		'This prompt is intentionally long so the layout has to wrap across several lines without clipping,',
		'overflowing its card, or hiding the controls below it. It repeats a few clauses to reach a realistic',
		'length: consider how the header, progress bar, and score controls behave when the front text runs',
		'well past the fold on a narrow viewport.',
	].join(' ');
	const longBack = [
		'The answer is equally long. Layout work here matters because cards with dense notes are common in',
		'medical and legal decks, and a review screen that only survives one-line answers is not usable.',
		'This text continues for a while to force the content area to grow and scroll inside the view,',
		'which is exactly the path a visual regression would break first.',
	].join(' ');
	const cards: FixtureCard[] = [
		{
			path: '/flashcards/long-1.md',
			uuid: uuidFor(501),
			type: 'basic',
			decks: ['A very long deck name that should not break the layout'],
			due: minutesFromNow(-40),
			body: basicBody(longFront, longBack),
		},
		{
			path: '/flashcards/long-2.md',
			uuid: uuidFor(502),
			type: 'cloze',
			decks: ['Long-form reading and extended responses'],
			due: minutesFromNow(-30),
			body: clozeBody(
				`A long cloze paragraph: the marker ${'{{c1::under test}}'} sits inside prose that keeps going so the revealed answer has room to breathe and the deletion controls stay reachable.`,
			),
		},
		{
			path: '/flashcards/long-3.md',
			uuid: uuidFor(503),
			type: 'quiz',
			decks: ['Long-form reading and extended responses'],
			due: minutesFromNow(-20),
			body: quizBody('Which option describes the overflow behaviour the layout should guarantee?', [
				{ text: 'The content scrolls inside the view while the controls remain visible.', correct: true },
				{ text: 'The card grows past the viewport and pushes the controls off screen.' },
			]),
		},
		{
			path: '/flashcards/long-4.md',
			uuid: uuidFor(504),
			type: 'sequence',
			decks: ['Long-form reading and extended responses'],
			due: minutesFromNow(-10),
			body: sequenceBody('Put the long-form layout checks in order.', [
				'Render the long prompt without clipping',
				'Scroll the answer area independently',
				'Keep every score control reachable',
			]),
		},
	];

	return {
		name: 'long-content',
		description: 'Overflowing prompts, decks and answers',
		documents: cardsFixture(cards),
		expectedCards: cards.length,
		expectedActiveCards: cards.length,
	};
}

function emptyFixture(): PlaygroundFixture {
	return {
		name: 'empty',
		description: 'No cards; every view shows its empty state',
		documents: { files: new Map(), dirPath: '/flashcards' },
		expectedCards: 0,
		expectedActiveCards: 0,
	};
}

export const FIXTURES: Record<string, PlaygroundFixture> = {
	empty: emptyFixture(),
	mixed: mixedFixture(),
	'due-heavy': dueHeavyFixture(),
	analytics: analyticsFixture(),
	paused: pausedFixture(),
	'long-content': longContentFixture(),
};

export const DEFAULT_FIXTURE_NAME = 'mixed';
export const FIXTURE_NAMES = Object.keys(FIXTURES);

export function resolveFixture(name: string | null): PlaygroundFixture {
	if (name && FIXTURES[name]) return FIXTURES[name];
	if (name) {
		console.warn(`[playground] Unknown fixture "${name}"; falling back to "${DEFAULT_FIXTURE_NAME}".`);
	}
	return FIXTURES[DEFAULT_FIXTURE_NAME];
}
