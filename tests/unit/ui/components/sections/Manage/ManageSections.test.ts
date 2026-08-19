import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import ManageHeader from '@/ui/components/sections/Manage/Header/component.svelte';
import ManageFilterBar from '@/ui/components/sections/Manage/FilterBar/component.svelte';
import ManagePagination from '@/ui/components/sections/Manage/Pagination/component.svelte';
import ManageTable from '@/ui/components/sections/Manage/Table/component.svelte';
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
	return html.match(/<button[^>]*ml-manage__reset[^>]*>/)?.[0] ?? '';
}

function tableProps(overrides: Record<string, unknown> = {}) {
	return {
		cards: [makeCard('a')],
		previews: { 'a.md': 'Front content' },
		deckOptions: ['Math', 'Lang'],
		onAddDeck: () => {},
		onRemoveDeck: () => {},
		onStatusChange: () => {},
		onEdit: () => {},
		onDelete: () => {},
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
	it('renders Type and Status selects, a searchable deck combobox, and Reset', () => {
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
		expect(body).toContain('ml-manage__filter-select');
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
		for (const header of ['Type', 'Content Preview', 'Decks', 'Status', 'Due Date', 'Actions']) {
			expect(body).toContain(header);
		}
		expect(body).toContain('<caption');
		expect(body).toContain('Manage flashcards');
	});

	it('renders a row per card with preview, deck chips, and card-specific labels', () => {
		const { body } = render(ManageTable, { props: tableProps() });
		expect(body).toContain('basic');
		expect(body).toContain('Front content');
		expect(body).toContain('Math');
		expect(body).toContain('Edit Front content');
		expect(body).toContain('Delete Front content');
		expect(body).toContain('Status for Front content');
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

