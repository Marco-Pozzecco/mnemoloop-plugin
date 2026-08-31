// @vitest-environment jsdom
import '../../../../../../helpers/dom-polyfills';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import { MarkdownRenderer } from 'obsidian';
import type { Flashcard } from '@/schemas';
import { CardStatus, CardType } from '@/schemas';
import FlashcardContentHarness from '../../../../../../helpers/FlashcardContentHarness.svelte';

const SOURCE_PATH = 'flashcards/rich-card.md';
const SOURCE_LINK = '[[sources/rich-card]]';

/** Every field deliberately contains all Markdown constructs that Obsidian owns. */
const RICH_MARKDOWN = [
	'![[assets/rich.png]]',
	'',
	'| Token | Value |',
	'| --- | --- |',
	'| mass | $m c^2$ |',
	'',
	'Inline $E=mc^2$ and display:',
	'',
	'$$',
	'\\int_0^1 x^2\\,dx',
	'$$',
	'',
	'```ts',
	'const rich: string = "rendered";',
	'```',
	'',
	'[Related note](https://example.com/related)',
	'',
	'**emphasis**',
].join('\n');

const BASIC_FRONT = `${RICH_MARKDOWN}\n\nBasic front`;
const BASIC_BACK = `${RICH_MARKDOWN}\n\nBasic back`;

const QUIZ_QUESTION = `${RICH_MARKDOWN}\n\nQuiz question`;
const QUIZ_OPTIONS = [
	`${RICH_MARKDOWN}\n\nQuiz option A`,
	`${RICH_MARKDOWN}\n\nQuiz option B`,
	`${RICH_MARKDOWN}\n\nQuiz option C`,
];

const SEQUENCE_QUESTION = `${RICH_MARKDOWN}\n\nSequence question`;
const SEQUENCE_STEPS = [
	`${RICH_MARKDOWN}\n\nSequence step A`,
	`${RICH_MARKDOWN}\n\nSequence step B`,
	`${RICH_MARKDOWN}\n\nSequence step C`,
];
const SHUFFLED_SEQUENCE_STEPS = [SEQUENCE_STEPS[1], SEQUENCE_STEPS[2], SEQUENCE_STEPS[0]];

const CLOZE_TEXT = `${RICH_MARKDOWN}\n\nCloze body`;
const CLOZE_ANSWER = `${RICH_MARKDOWN}\n\nCloze answer`;
const CLOZE_HINT = `${RICH_MARKDOWN}\n\nCloze hint`;
const CLOZE_ID = 'cloze-1';
const CLOZE_PLACEHOLDER = (active: boolean) =>
	`<span class="ml-cloze-placeholder${active ? ' ml-cloze-placeholder-active' : ''}" data-cloze-id="${CLOZE_ID}" role="button" tabindex="0">[...]</span>`;
const CLOZE_INITIAL = `${CLOZE_TEXT}${CLOZE_PLACEHOLDER(true)}`;
const CLOZE_INITIAL_INACTIVE = `${CLOZE_TEXT}${CLOZE_PLACEHOLDER(false)}`;
const CLOZE_REVEALED = `${CLOZE_TEXT}${CLOZE_ANSWER}`;

interface RendererCall {
	content: string;
	target: HTMLElement;
	sourcePath: string;
}

type MountedHarness = Record<string, any>;

const renderMock = vi.mocked(MarkdownRenderer.render);

function appendDeterministicRendererDom(target: HTMLElement, content: string): void {
	const marker = activeDocument.createElement('div');
	marker.dataset.renderedContent = content;
	marker.textContent = `Rendered Markdown: ${content}`;
	target.append(marker);

	// Preserve Cloze's renderer-generated placeholder DOM so the test exercises the
	// delegated click/keyboard handlers rather than calling a component function.
	const placeholderPattern =
		/<span class="([^"]+)" data-cloze-id="([^"]+)" role="button" tabindex="0">\[\.\.\.\]<\/span>/g;
	for (const match of content.matchAll(placeholderPattern)) {
		const placeholder = activeDocument.createElement('span');
		placeholder.className = match[1];
		placeholder.dataset.clozeId = match[2];
		placeholder.setAttribute('role', 'button');
		placeholder.tabIndex = 0;
		placeholder.textContent = '[...]';
		target.append(placeholder);
	}
}

function rendererCalls(): RendererCall[] {
	return renderMock.mock.calls.map((call) => ({
		content: call[1],
		target: call[2],
		sourcePath: call[3],
	}));
}

function visibleRendererContents(target: HTMLElement): string[] {
	return Array.from(target.querySelectorAll<HTMLElement>('[data-rendered-content]')).map(
		(element) => element.dataset.renderedContent ?? '',
	);
}

function expectRendererHandoff(expected: string[], allowed = [...expected, SOURCE_LINK]): void {
	const calls = rendererCalls();
	expect(calls.length).toBeGreaterThan(0);
	expect(calls.every((call) => call.sourcePath === SOURCE_PATH)).toBe(true);
	expect(calls.every((call) => [...allowed, SOURCE_LINK].includes(call.content))).toBe(true);
	for (const content of expected) {
		expect(calls.some((call) => call.content === content)).toBe(true);
	}
}

function makeCard(cardType: CardType, content: unknown): Flashcard {
	return {
		uuid: '00000000-0000-4000-8000-000000000029',
		source: SOURCE_LINK,
		status: CardStatus.ACTIVE,
		decks: [],
		card_type: cardType,
		content,
	} as unknown as Flashcard;
}

const BASIC_CARD = makeCard(CardType.Basic, {
	meta_type: CardType.Basic,
	front: BASIC_FRONT,
	back: BASIC_BACK,
});

const QUIZ_CARD = makeCard(CardType.Quiz, {
	meta_type: CardType.Quiz,
	question: QUIZ_QUESTION,
	options: QUIZ_OPTIONS,
	correct_index: 1,
});

const SEQUENCE_CARD = makeCard(CardType.Sequence, {
	meta_type: CardType.Sequence,
	question: SEQUENCE_QUESTION,
	steps: SEQUENCE_STEPS,
});

const CLOZE_CARD = makeCard(CardType.Cloze, {
	meta_type: CardType.Cloze,
	text: CLOZE_TEXT,
	deletions: [
		{
			id: CLOZE_ID,
			answer: CLOZE_ANSWER,
			hint: CLOZE_HINT,
			positions: [CLOZE_TEXT.length],
		},
	],
});

async function settle(): Promise<void> {
	await tick();
	await tick();
}

describe('review flashcard renderer handoff', () => {
	let target: HTMLDivElement;
	let instance: MountedHarness | undefined;

	beforeEach(() => {
		renderMock.mockReset();
		renderMock.mockImplementation(async (_app, content, renderTarget, _sourcePath) => {
			appendDeterministicRendererDom(renderTarget, content);
			return undefined;
		});
	});

	afterEach(() => {
		if (instance) unmount(instance);
		target?.remove();
		vi.restoreAllMocks();
	});

	function mountCard(
		flashcard: Flashcard,
		isAnswerShowing = false,
		callbacks: {
			onShowAnswer?: () => void;
			onSetAnswerCorrectness?: (isCorrect: boolean) => void;
			onAllRevealed?: () => void;
		} = {},
	): void {
		target = activeDocument.createElement('div');
		activeDocument.body.append(target);
		instance = mount(FlashcardContentHarness, {
			target,
			props: {
				flashcard,
				sourcePath: SOURCE_PATH,
				isAnswerShowing,
				...callbacks,
			},
		});
	}

	it('renders Basic front, back, and source footer through Obsidian MarkdownRenderer', async () => {
		mountCard(BASIC_CARD, true);
		await settle();

		const expected = [BASIC_FRONT, BASIC_BACK, SOURCE_LINK];
		expectRendererHandoff(expected);
		expect(visibleRendererContents(target)).toEqual(expect.arrayContaining(expected));
		expect(target.querySelector('.ml-flashcard-front [data-rendered-content]')?.textContent).toContain(
			'Basic front',
		);
		expect(target.querySelector('.ml-flashcard-back [data-rendered-content]')?.textContent).toContain(
			'Basic back',
		);
		expect(target.querySelector('.ml-flashcard-footer [data-rendered-content]')?.textContent).toContain(
			SOURCE_LINK,
		);
	});

	it('renders Quiz question and options and keeps click, Enter, Space, and number selection usable', async () => {
		mountCard(QUIZ_CARD);
		await settle();

		const expected = [QUIZ_QUESTION, ...QUIZ_OPTIONS];
		expectRendererHandoff(expected);
		expect(target.querySelector<HTMLElement>('.ml-quiz-question [data-rendered-content]')?.dataset.renderedContent).toBe(
			QUIZ_QUESTION,
		);
		expect(target.querySelectorAll('.ml-quiz-option-text [data-rendered-content]')).toHaveLength(3);
		const options = Array.from(target.querySelectorAll<HTMLElement>('[role="radio"]'));
		expect(options).toHaveLength(3);
		expect(options.every((option) => option.getAttribute('aria-checked') === 'false')).toBe(true);

		options[0].click();
		await settle();
		expect(options[0].getAttribute('aria-checked')).toBe('true');
		expect(options[1].getAttribute('aria-checked')).toBe('false');

		options[1].dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
		);
		await settle();
		expect(options[1].getAttribute('aria-checked')).toBe('true');

		options[2].dispatchEvent(
			new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }),
		);
		await settle();
		expect(options[2].getAttribute('aria-checked')).toBe('true');

		const quizContainer = target.querySelector<HTMLElement>('.ml-quiz-content');
		if (!quizContainer) throw new Error('Quiz container not found');
		Object.defineProperty(quizContainer, 'offsetParent', {
			configurable: true,
			value: activeDocument.body,
		});
		window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true, cancelable: true }));
		await settle();
		expect(options[0].getAttribute('aria-checked')).toBe('true');
	});

	it('renders Sequence question and shuffled steps, then original steps when answers are shown', async () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		mountCard(SEQUENCE_CARD);
		await settle();

		const expected = [SEQUENCE_QUESTION, ...SEQUENCE_STEPS];
		expectRendererHandoff(expected);
		expect(
			target.querySelector<HTMLElement>('.ml-sequence-question [data-rendered-content]')?.dataset.renderedContent,
		).toBe(SEQUENCE_QUESTION);
		expect(
			Array.from(target.querySelectorAll<HTMLElement>('.ml-sequence-step-text [data-rendered-content]')).map(
				(element) => element.dataset.renderedContent,
			),
		).toEqual(SHUFFLED_SEQUENCE_STEPS);

		if (instance) unmount(instance);
		target.remove();
		instance = undefined;
		renderMock.mockClear();

		mountCard(SEQUENCE_CARD, true);
		await settle();

		const answerExpected = [SEQUENCE_QUESTION, ...SEQUENCE_STEPS, ...SHUFFLED_SEQUENCE_STEPS];
		expectRendererHandoff(answerExpected);
		expect(
			Array.from(target.querySelectorAll<HTMLElement>('.ml-sequence-step-original [data-rendered-content]')).map(
				(element) => element.dataset.renderedContent,
			),
		).toEqual(SHUFFLED_SEQUENCE_STEPS);
	});

	it('renders Cloze placeholders, rich hints, and revealed answers through the renderer', async () => {
		const onShowAnswer = vi.fn();
		const onAllRevealed = vi.fn();
		mountCard(CLOZE_CARD, false, { onShowAnswer, onAllRevealed });
		await settle();

		expectRendererHandoff([CLOZE_INITIAL], [CLOZE_INITIAL, CLOZE_INITIAL_INACTIVE]);
		expect(target.querySelector('.ml-cloze-text [data-cloze-id="cloze-1"]')).not.toBeNull();
		expect(target.querySelector('.ml-cloze-text .ml-cloze-placeholder-active')).not.toBeNull();

		const hintButton = Array.from(target.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
			button.textContent?.includes('Show hint'),
		);
		if (!hintButton) throw new Error('Show hint button not found');
		hintButton.click();
		await settle();

		expectRendererHandoff(
			[CLOZE_INITIAL, CLOZE_HINT],
			[CLOZE_INITIAL, CLOZE_INITIAL_INACTIVE, CLOZE_HINT],
		);
		expect(target.querySelector<HTMLElement>('.ml-cloze-hint [data-rendered-content]')?.dataset.renderedContent).toBe(
			CLOZE_HINT,
		);

		const placeholder = target.querySelector<HTMLElement>('.ml-cloze-text .ml-cloze-placeholder-active');
		if (!placeholder) throw new Error('Active Cloze placeholder not found');
		placeholder.click();
		await settle();

		expectRendererHandoff(
			[CLOZE_INITIAL, CLOZE_HINT, CLOZE_REVEALED],
			[CLOZE_INITIAL, CLOZE_INITIAL_INACTIVE, CLOZE_HINT, CLOZE_REVEALED],
		);
		expect(target.querySelector<HTMLElement>('.ml-cloze-text [data-rendered-content]')?.dataset.renderedContent).toBe(
			CLOZE_REVEALED,
		);
		expect(target.querySelector('.ml-cloze-hint')).toBeNull();
		expect(target.querySelector('button.ml-cloze-hint__button')).toBeNull();
		expect(target.querySelector('.ml-cloze-hint__disclosure')).toBeNull();
		expect(onAllRevealed).toHaveBeenCalledTimes(1);
		expect(onShowAnswer).toHaveBeenCalledTimes(1);
	});
});
