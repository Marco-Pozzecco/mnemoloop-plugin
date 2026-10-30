import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import ManageHeader from '@/ui/components/sections/Manage/Header/component.svelte';
import ManageFilterBar from '@/ui/components/sections/Manage/FilterBar/component.svelte';
import ManagePagination from '@/ui/components/sections/Manage/Pagination/component.svelte';
import ManageTable from '@/ui/components/sections/Manage/Table/component.svelte';
import ManageCardList from '@/ui/components/sections/Manage/CardList/component.svelte';
import { CardStatus, CardType } from '@/schemas';
import type { FlashcardMetadata } from '@/schemas';

function makeCard(id: string, extra: Partial<FlashcardMetadata> = {}): FlashcardMetadata {
	return {
		uuid: `uuid-${id}`,
		file: `${id}.md`,
		card_type: CardType.Basic,
		status: CardStatus.ACTIVE,
		decks: ['Math', 'Lang'],
		due: 0,
		...extra,
	} as unknown as FlashcardMetadata;
}

function buttonTagWithLabel(html: string, label: string): string {
	return html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0] ?? '';
}

function resetButtonTag(html: string): string {
	const index = html.indexOf('Reset filters');
	if (index === -1) return '';
	const start = html.lastIndexOf('<button', index);
	return html.slice(start, index);
}

function hrefFor(card: FlashcardMetadata): string {
	return `obsidian://open?vault=v&file=${encodeURIComponent(card.file)}`;
}

function tableProps(overrides: Record<string, unknown> = {}) {
	return {
		cards: [makeCard('a')],
		previews: { 'a.md': 'Front content' },
		hrefFor,
		onOpen: () => {},
		...overrides,
	};
}

describe('ManageHeader', () => {
	it('renders the title, filtered summary, and Add button', () => {
		const { body } = render(ManageHeader, {
			props: { totalCount: 30, visibleCount: 12, onAdd: () => {} },
		});
		expect(body).toContain('Manage flashcards');
		expect(body).toContain('12 of 30 cards');
		expect(body).toContain('Add');
	});

	it('renders a total-only summary when no filter is active', () => {
		const { body } = render(ManageHeader, {
			props: { totalCount: 30, visibleCount: 30, onAdd: () => {} },
		});
		expect(body).toContain('30 cards');
		expect(body).not.toContain('of 30 cards');
	});

	it('omits the summary when there are no cards', () => {
		const { body } = render(ManageHeader, {
			props: { totalCount: 0, visibleCount: 0, onAdd: () => {} },
		});
		expect(body).not.toContain('ml-manage__subtitle');
	});
});

describe('ManageFilterBar', () => {
	it('renders labelled Type and Status selects, a searchable deck combobox, and Reset', () => {
		const { body } = render(ManageFilterBar, {
			props: {
				filters: { type: '', status: '', deck: '' },
				deckOptions: ['Math', 'Lang'],
				onChange: () => {},
				onReset: () => {},
			},
		});
		expect(body).toContain('>Type');
		expect(body).toContain('>Status');
		expect(body).toContain('>Deck');
		expect(body).toContain('Search filename or deck');
		expect(body).toContain('All decks');
		expect(body).toContain('ml-combobox__trigger');
		expect(body).toContain('Reset filters');
	});

	it('disables Reset when no filters are active', () => {
		const { body } = render(ManageFilterBar, {
			props: {
				filters: { type: '', status: '', deck: '' },
				deckOptions: [],
				onChange: () => {},
				onReset: () => {},
			},
		});
		expect(resetButtonTag(body)).toContain('disabled');
	});

	it('enables Reset when a filter is active', () => {
		const { body } = render(ManageFilterBar, {
			props: {
				filters: { type: CardType.Quiz, status: '', deck: '' },
				deckOptions: [],
				onChange: () => {},
				onReset: () => {},
			},
		});
		expect(resetButtonTag(body)).not.toContain('disabled');
	});
});

describe('ManagePagination', () => {
	it('renders the page indicator', () => {
		const { body } = render(ManagePagination, {
			props: { currentPage: 2, totalPages: 5, onPrevious: () => {}, onNext: () => {} },
		});
		expect(body).toContain('Page 2 of 5');
	});

	it('disables Previous on the first page', () => {
		const { body } = render(ManagePagination, {
			props: { currentPage: 1, totalPages: 5, onPrevious: () => {}, onNext: () => {} },
		});
		expect(buttonTagWithLabel(body, 'Previous page')).toContain('disabled');
	});

	it('disables Next on the last page', () => {
		const { body } = render(ManagePagination, {
			props: { currentPage: 5, totalPages: 5, onPrevious: () => {}, onNext: () => {} },
		});
		expect(buttonTagWithLabel(body, 'Next page')).toContain('disabled');
	});

	it('enables both buttons on a middle page', () => {
		const { body } = render(ManagePagination, {
			props: { currentPage: 3, totalPages: 5, onPrevious: () => {}, onNext: () => {} },
		});
		expect(buttonTagWithLabel(body, 'Previous page')).not.toContain('disabled');
		expect(buttonTagWithLabel(body, 'Next page')).not.toContain('disabled');
	});

	it('renders a result range, first/last controls, and direct page entry', () => {
		const { body } = render(ManagePagination, {
			props: {
				currentPage: 2,
				totalPages: 5,
				totalItems: 42,
				pageSize: 10,
				onPageChange: () => {},
			},
		});
		expect(body).toContain('Showing 11–20 of 42');
		expect(body).toContain('Page 2 of 5');
		expect(buttonTagWithLabel(body, 'First page')).not.toContain('disabled');
		expect(buttonTagWithLabel(body, 'Last page')).not.toContain('disabled');
		expect(body).toContain('aria-label="Page number"');
		expect(body).toContain('>Go');
	});
});

describe('ManageTable', () => {
	it('renders the six column headers and an accessible table caption', () => {
		const { body } = render(ManageTable, { props: tableProps() });
		for (const header of ['Type', 'Content preview', 'Decks', 'Status', 'Due date', 'Open']) {
			expect(body).toContain(header);
		}
		expect(body).toContain('<caption');
		expect(body).toContain('Manage flashcards');
	});

	it('renders a read-only row: badge, preview link, deck chips, status, and due date', () => {
		const { body } = render(ManageTable, { props: tableProps() });
		expect(body).toContain('Basic');
		expect(body).toContain('Front content');
		expect(body).toContain('Math');
		expect(body).toContain('ACTIVE');
		expect(body).toContain('1970-01-01');
		expect(body).toContain('obsidian://open?vault=v&amp;file=a.md');
	});

	it('titles the deck chips with the full deck list and folds the rest into +N', () => {
		const { body } = render(ManageTable, {
			props: tableProps({
				cards: [makeCard('a', { decks: ['Math', 'Lang', 'Biology'] })],
			}),
		});
		expect(body).toContain('title="Math, Lang, Biology"');
		expect(body).toContain('+1');
	});

	it('carries the folded deck names to assistive tech and adds no fold chrome when nothing folds', () => {
		const folded = render(ManageTable, {
			props: tableProps({
				cards: [makeCard('a', { decks: ['Math', 'Lang', 'Biology'] })],
			}),
		});
		expect(folded.body).toContain('ml-visually-hidden">, also in Biology');

		const fits = render(ManageTable, { props: tableProps() });
		expect(fits.body).not.toContain(', also in');
		expect(fits.body).not.toContain('title="Math, Lang"');
	});

	it('draws status as a badge without the status dot', () => {
		const { body } = render(ManageTable, { props: tableProps() });
		expect(body).toContain('ml-badge--success');
		expect(body).not.toContain('ml-badge__dot');
	});

	it('renders no inline editing controls', () => {
		const { body } = render(ManageTable, { props: tableProps() });
		expect(body).not.toContain('ml-select');
		expect(body).not.toContain('ml-combobox');
		expect(body).not.toContain('aria-label="Status for');
	});

	it('marks the selected row', () => {
		const { body } = render(ManageTable, {
			props: tableProps({ selectedUuid: 'uuid-a' }),
		});
		expect(body).toContain('ml-table__row--selected');
	});

	it('renders two rows when two cards are provided', () => {
		const { body } = render(ManageTable, {
			props: tableProps({
				cards: [makeCard('a'), makeCard('b')],
				previews: { 'a.md': 'A', 'b.md': 'B' },
			}),
		});
		expect(body).toContain('A');
		expect(body).toContain('B');
	});
});

describe('ManageCardList', () => {
	it('renders one anchor card per row with the scan metadata', () => {
		const { body } = render(ManageCardList, {
			props: {
				cards: [makeCard('a')],
				previews: { 'a.md': 'Front content' },
				hrefFor,
				onOpen: () => {},
			},
		});
		expect(body).toContain('<a class="ml-manage-card');
		expect(body).toContain('obsidian://open?vault=v&amp;file=a.md');
		expect(body).toContain('Basic');
		expect(body).toContain('ACTIVE');
		expect(body).toContain('Front content');
		expect(body).toContain('Math');
		expect(body).not.toContain('ml-badge__dot');
		expect(body).not.toContain('<button');
	});
});
