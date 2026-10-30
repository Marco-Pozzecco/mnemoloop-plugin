// @vitest-environment jsdom
import '../../../../helpers/dom-polyfills';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import type { App } from 'obsidian';
import {
	EventBus,
	FlashcardIndexGetAllResponseEvent,
	FlashcardIndexStateEvent,
	FlashcardParserParseRequestEvent,
	FlashcardParserParseResponseEvent,
	FlashcardWriterCreateRequestEvent,
	FlashcardWriterCreateResponseEvent,
	FlashcardWriterUpdateRequestEvent,
	FlashcardWriterUpdateResponseEvent,
} from '@/modules/events';
import { CardStatus, CardType } from '@/schemas';
import type { Flashcard } from '@/schemas';
import { modalStore } from '@/ui/store/modal.store';
import { sidebarStore } from '@/ui/store/sidebar.store';
import SidebarPanel from '@/ui/views/Sidebar/component.svelte';
import { createFlashcardMetadata } from '../../../../helpers/factories';
import { createMockMetadataCache } from '../../../../helpers/mock-obsidian';
import { resetSingletons } from '../../../../helpers/reset-singletons';

const NOTE_PATH = 'notes/biology.md';
const OTHER_NOTE_PATH = 'notes/chemistry.md';

interface TestApp extends App {
	setActiveFile(file: unknown): void;
	emitActiveLeafChange(): void;
}

function activeNote(path = NOTE_PATH) {
	const basename = path.slice(path.lastIndexOf('/') + 1, -'.md'.length);
	return { path, basename, extension: 'md' };
}

function createApp(note: unknown): TestApp {
	let activeFile = note;
	const listeners: Array<() => void> = [];

	return {
		workspace: {
			getActiveFile: () => activeFile,
			on: (event: string, callback: () => void) => {
				if (event === 'active-leaf-change') listeners.push(callback);
				return {};
			},
			offref: () => undefined,
			openLinkText: vi.fn(),
		},
		metadataCache: createMockMetadataCache(undefined, undefined, {
			linkTargets: {
				'notes/biology.md': NOTE_PATH,
				'notes/biology': NOTE_PATH,
				biology: NOTE_PATH,
				'notes/chemistry.md': OTHER_NOTE_PATH,
				'notes/chemistry': OTHER_NOTE_PATH,
				chemistry: OTHER_NOTE_PATH,
			},
		}),
		setActiveFile: (file: unknown) => {
			activeFile = file;
		},
		emitActiveLeafChange: () => {
			for (const callback of listeners) callback();
		},
	} as unknown as TestApp;
}

function card(
	uuid: string,
	status: CardStatus,
	createdAt: string,
	type = CardType.Basic,
	source = `[[${NOTE_PATH}]]`,
) {
	return createFlashcardMetadata({
		uuid,
		file: `cards/${uuid}.md`,
		source,
		status,
		card_type: type,
		created_at: createdAt,
		updated_at: createdAt,
	});
}

function parseResult(
	filepath: string,
	front: string,
	uuid = '00000000-0000-0000-0000-000000000000',
): FlashcardParserParseResponseEvent {
	const metadata = createFlashcardMetadata({ file: filepath, uuid });
	return new FlashcardParserParseResponseEvent({
		entity: {
			...metadata,
			content: { meta_type: CardType.Basic, front, back: 'back' },
		} as unknown as Flashcard,
		stats: { created_at: metadata.created_at, updated_at: metadata.updated_at },
		filepath,
		success: true,
	});
}

async function flush(): Promise<void> {
	await Promise.resolve();
	await tick();
	await Promise.resolve();
	await tick();
}

async function publishCards(cards: ReturnType<typeof card>[]): Promise<void> {
	await EventBus.instance.publish(
		new FlashcardIndexStateEvent({ flashcards: cards, total: cards.length }),
	);
}

describe('flashcard sidebar panel', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount> | undefined;
	let app: TestApp;
	let publish: ReturnType<typeof createPublishSpy>;

	function createPublishSpy() {
		return vi.spyOn(EventBus.instance, 'publish');
	}

	async function mountPanel(
		props: {
			collapsedGroups?: string[];
			onCollapsedGroupsChange?: (groups: string[]) => void;
		} = {},
	): Promise<void> {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(SidebarPanel, { target, props: { app, ...props } });
		await flush();
		// The real index answers the panel's GetAll request; settle it so the panel
		// leaves its loading state.
		await EventBus.instance.publish(new FlashcardIndexGetAllResponseEvent([]));
		await flush();
	}

	function groupTrigger(label: string): HTMLButtonElement | null {
		return target.querySelector<HTMLButtonElement>(`[aria-label^="${label},"]`);
	}

	function groupHeader(label: string): HTMLElement | null {
		const trigger = groupTrigger(label);
		return trigger?.closest('.ml-sidebar-group') ?? null;
	}

	function buttonByText(label: string): HTMLButtonElement {
		const button = Array.from(target.querySelectorAll<HTMLButtonElement>('button')).find(
			(element) => element.textContent?.trim() === label,
		);
		if (!button) throw new Error(`No button labeled "${label}"`);
		return button;
	}

	function sourceFieldValue(): string | undefined {
		return Array.from(target.querySelectorAll<HTMLInputElement>('input')).find((input) =>
			input.value.startsWith('[['),
		)?.value;
	}

	function textareas(): HTMLTextAreaElement[] {
		return Array.from(target.querySelectorAll<HTMLTextAreaElement>('textarea'));
	}

	function fillBasicForm(front: string, back: string): void {
		const areas = textareas();
		if (areas.length < 2) throw new Error('Expected a Basic form');
		areas[0].value = front;
		areas[0].dispatchEvent(new Event('change', { bubbles: true }));
		areas[1].value = back;
		areas[1].dispatchEvent(new Event('change', { bubbles: true }));
	}

	function published<T>(eventClass: abstract new (...args: never[]) => T): T | undefined {
		return publish.mock.calls
			.map(([event]) => event as unknown)
			.find((event): event is T => event instanceof eventClass);
	}

	beforeEach(() => {
		resetSingletons();
		sidebarStore.reset();
		modalStore.close();
		app = createApp(activeNote());
		publish = createPublishSpy();
	});

	afterEach(async () => {
		if (instance) await unmount(instance);
		instance = undefined;
		target?.remove();
		activeDocument.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('groups the note cards by status, states each count, and leads with stale', async () => {
		await mountPanel();
		await flush();
		await publishCards([
			card('a1', CardStatus.ACTIVE, '2026-01-01T00:00:00.000Z'),
			card('a2', CardStatus.ACTIVE, '2026-01-02T00:00:00.000Z'),
			card('s1', CardStatus.STALE, '2026-01-03T00:00:00.000Z'),
			card('p1', CardStatus.PAUSED, '2026-01-04T00:00:00.000Z'),
		]);
		await flush();

		const headers = Array.from(target.querySelectorAll<HTMLElement>('.ml-sidebar-group__label'));
		expect(headers.map((header) => header.textContent)).toEqual(['Stale', 'Active', 'Paused']);
		expect(groupTrigger('Stale')?.textContent).toContain('1');
		expect(groupTrigger('Active')?.textContent).toContain('2');
	});

	it('shows each row as a type label and a content preview, newest first', async () => {
		await mountPanel();
		await flush();
		await publishCards([
			card('old', CardStatus.ACTIVE, '2026-01-01T00:00:00.000Z'),
			card('new', CardStatus.ACTIVE, '2026-01-02T00:00:00.000Z', CardType.Cloze),
		]);
		await flush();

		const requests = publish.mock.calls
			.map(([event]) => event)
			.filter((event): event is FlashcardParserParseRequestEvent =>
				event instanceof FlashcardParserParseRequestEvent,
			);
		for (const request of requests) {
			await EventBus.instance.publish(
				parseResult(request.data.filepath, `Preview of ${request.data.filepath}`),
			);
		}
		await flush();

		const rows = Array.from(target.querySelectorAll<HTMLElement>('.ml-sidebar-row'));
		expect(rows.map((row) => row.querySelector('.ml-sidebar-row__type')?.textContent)).toEqual([
			'cloze',
			'basic',
		]);
		expect(rows[0].querySelector('.ml-sidebar-row__preview')?.textContent).toContain(
			'cards/new.md',
		);
	});

	it('shows the empty state when the note has no linked cards', async () => {
		await mountPanel();
		await flush();
		await publishCards([]);
		await flush();

		expect(target.querySelector('.ml-sidebar__empty-title')?.textContent).toBe(
			'No cards from this note yet',
		);
	});

	it('disables the New card button and states no note when there is no active markdown file', async () => {
		app = createApp({ path: 'attachments/diagram.png', basename: 'diagram', extension: 'png' });
		await mountPanel();
		await flush();

		const button = Array.from(target.querySelectorAll<HTMLButtonElement>('button')).find(
			(element) => element.textContent?.includes('New card'),
		);
		expect(button?.disabled).toBe(true);
		expect(target.textContent).toContain('No note open');
	});

	it('keeps a collapsed group collapsed after a remount', async () => {
		const changes: string[][] = [];
		await mountPanel({ onCollapsedGroupsChange: (groups) => changes.push(groups) });
		await flush();
		await publishCards([card('a1', CardStatus.ACTIVE, '2026-01-01T00:00:00.000Z')]);
		await flush();

		groupTrigger('Active')?.click();
		await flush();
		expect(changes.at(-1)).toEqual(['ACTIVE']);

		await unmount(instance!);
		instance = undefined;
		target.remove();

		await mountPanel({ collapsedGroups: changes.at(-1) });
		await flush();
		await publishCards([card('a1', CardStatus.ACTIVE, '2026-01-01T00:00:00.000Z')]);
		await flush();

		expect(groupTrigger('Active')?.getAttribute('aria-expanded')).toBe('false');
		expect(
			groupHeader('Active')
				?.querySelector('.ml-collapsible__content')
				?.getAttribute('data-state'),
		).toBe('closed');
	});

	it('opens the create form in place of the list with the note link, and no modal', async () => {
		await mountPanel();
		await flush();
		await publishCards([card('a1', CardStatus.ACTIVE, '2026-01-01T00:00:00.000Z')]);
		await flush();

		buttonByText('New card').click();
		await flush();

		expect(target.querySelector('.ml-flashcard-form')).not.toBeNull();
		expect(target.querySelector('.ml-sidebar-row')).toBeNull();
		expect(sourceFieldValue()).toBe(`[[${NOTE_PATH}]]`);
		expect(modalStore.state.currentView).toBeNull();
	});

	it('returns to the list after a successful create without changing the active note', async () => {
		await mountPanel();
		await publishCards([]);
		await flush();

		buttonByText('New card').click();
		await flush();
		fillBasicForm('New question', 'New answer');
		await flush();
		buttonByText('Save').click();
		await flush();

		const request = published(FlashcardWriterCreateRequestEvent);
		expect(request).toBeDefined();
		expect(request!.data.source).toBe(`[[${NOTE_PATH}]]`);

		await EventBus.instance.publish(
			new FlashcardWriterCreateResponseEvent({
				filepath: 'cards/new.md',
				success: true,
				requestId: request!.id,
			}),
		);
		await flush();

		expect(target.querySelector('.ml-flashcard-form')).toBeNull();
		expect(app.workspace.getActiveFile()?.path).toBe(NOTE_PATH);
		expect(app.workspace.openLinkText).not.toHaveBeenCalled();

		// The index publishes the new card; the panel follows it.
		await publishCards([card('new', CardStatus.ACTIVE, '2026-01-05T00:00:00.000Z')]);
		await flush();

		expect(target.querySelector('.ml-sidebar-row__type')?.textContent).toBe('basic');
	});

	it('closes the create form on cancel without writing', async () => {
		await mountPanel();
		await publishCards([card('a1', CardStatus.ACTIVE, '2026-01-01T00:00:00.000Z')]);
		await flush();

		buttonByText('New card').click();
		await flush();
		fillBasicForm('Discarded question', 'Discarded answer');
		buttonByText('Cancel').click();
		await flush();

		expect(target.querySelector('.ml-flashcard-form')).toBeNull();
		expect(target.querySelector('.ml-sidebar-row')).not.toBeNull();
		expect(published(FlashcardWriterCreateRequestEvent)).toBeUndefined();

		// Reopening shows a fresh, empty form.
		buttonByText('New card').click();
		await flush();
		expect(textareas().map((area) => area.value)).toEqual(['', '']);
	});

	it('keeps the create form open with the error and the typed input when validation fails', async () => {
		await mountPanel();
		await flush();

		buttonByText('New card').click();
		await flush();
		const areas = textareas();
		areas[1].value = 'Kept answer';
		areas[1].dispatchEvent(new Event('change', { bubbles: true }));

		buttonByText('Save').click();
		await flush();

		expect(target.textContent).toContain('Front is required.');
		expect(target.querySelector('.ml-flashcard-form')).not.toBeNull();
		expect(textareas()[1].value).toBe('Kept answer');
		expect(published(FlashcardWriterCreateRequestEvent)).toBeUndefined();
	});

	it('opens the edit form in place of the list when a row is activated, and refreshes the row on save', async () => {
		await mountPanel();
		await flush();
		await publishCards([card('a1', CardStatus.ACTIVE, '2026-01-01T00:00:00.000Z')]);
		await flush();

		const filepath = 'cards/a1.md';
		target.querySelector<HTMLButtonElement>('.ml-sidebar-row')?.click();
		await flush();

		await EventBus.instance.publish(parseResult(filepath, 'Full card front', 'a1'));
		await flush();

		expect(target.querySelector('.ml-flashcard-form')).not.toBeNull();
		expect(target.querySelector('.ml-sidebar-row')).toBeNull();
		expect(textareas().map((area) => area.value)).toEqual(['Full card front', 'back']);
		expect(modalStore.state.currentView).toBeNull();

		fillBasicForm('Updated front', 'Updated back');
		await flush();
		buttonByText('Save').click();
		await flush();

		const request = published(FlashcardWriterUpdateRequestEvent);
		expect(request).toBeDefined();
		expect(request!.data.uuid).toBe('a1');

		await EventBus.instance.publish(
			new FlashcardWriterUpdateResponseEvent({
				filepath,
				success: true,
				requestId: request!.id,
			}),
		);
		await flush();

		expect(target.querySelector('.ml-flashcard-form')).toBeNull();
		expect(target.querySelector('.ml-sidebar-row')).not.toBeNull();
		expect(app.workspace.openLinkText).not.toHaveBeenCalled();

		// The update invalidated the cached preview and requested a fresh parse.
		const freshRequest = publish.mock.calls
			.map(([event]) => event)
			.filter((event): event is FlashcardParserParseRequestEvent =>
				event instanceof FlashcardParserParseRequestEvent,
			)
			.at(-1);
		expect(freshRequest?.data.filepath).toBe(filepath);

		await EventBus.instance.publish(parseResult(filepath, 'Updated front', 'a1'));
		await EventBus.instance.publish(
			new FlashcardIndexStateEvent({
				flashcards: [card('a1', CardStatus.ACTIVE, '2026-01-01T00:00:00.000Z')],
				total: 1,
			}),
		);
		await flush();

		expect(target.querySelector('.ml-sidebar-row__preview')?.textContent).toBe('Updated front');
	});

	it('closes the edit form on cancel without writing', async () => {
		await mountPanel();
		await flush();
		await publishCards([card('a1', CardStatus.ACTIVE, '2026-01-01T00:00:00.000Z')]);
		await flush();

		target.querySelector<HTMLButtonElement>('.ml-sidebar-row')?.click();
		await flush();
		await EventBus.instance.publish(parseResult('cards/a1.md', 'Full card front', 'a1'));
		await flush();

		expect(target.querySelector('.ml-flashcard-form')).not.toBeNull();
		buttonByText('Cancel').click();
		await flush();

		expect(target.querySelector('.ml-flashcard-form')).toBeNull();
		expect(target.querySelector('.ml-sidebar-row')).not.toBeNull();
		expect(published(FlashcardWriterUpdateRequestEvent)).toBeUndefined();
	});

	it('closes an open form and shows the new note’s list when the active note changes', async () => {
		await mountPanel();
		await flush();
		await publishCards([
			card('b1', CardStatus.ACTIVE, '2026-01-01T00:00:00.000Z'),
			card(
				'c1',
				CardStatus.ACTIVE,
				'2026-01-02T00:00:00.000Z',
				CardType.Basic,
				`[[${OTHER_NOTE_PATH}]]`,
			),
		]);
		await flush();

		buttonByText('New card').click();
		await flush();
		fillBasicForm('Unsaved question', 'Unsaved answer');
		await flush();

		app.setActiveFile(activeNote(OTHER_NOTE_PATH));
		app.emitActiveLeafChange();
		await flush();

		expect(target.querySelector('.ml-flashcard-form')).toBeNull();
		expect(target.querySelector('.ml-sidebar__source-name')?.textContent).toBe('chemistry');
		const rows = Array.from(target.querySelectorAll<HTMLElement>('.ml-sidebar-row'));
		expect(rows).toHaveLength(1);

		// The discarded form does not come back; a new one binds to the new note.
		buttonByText('New card').click();
		await flush();
		expect(sourceFieldValue()).toBe(`[[${OTHER_NOTE_PATH}]]`);
		expect(textareas().map((area) => area.value)).toEqual(['', '']);
	});
});
