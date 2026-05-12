import { describe, expect, it } from 'vitest';
import { buildDeckTree, DeckNode } from '@/ui/store/deck-tree.store';
import { FlashcardMetadata } from '@/schemas';
import { DEFAULT_FSRS } from '@/utils/constants';

function createCard(overrides: Partial<FlashcardMetadata> = {}): FlashcardMetadata {
	const now = new Date().toISOString();
	const future = new Date(Date.now() + 86400000).toISOString();
	return {
		...DEFAULT_FSRS,
		uuid: 'test-uuid',
		source: null,
		status: 'ACTIVE',
		due: future,
		file: 'test.md',
		created_at: now,
		updated_at: now,
		deleted_at: null,
		...overrides,
	} as FlashcardMetadata;
}

describe('buildDeckTree', () => {
	it('should return empty tree for no cards', () => {
		const tree = buildDeckTree([]);
		expect(tree).toEqual([]);
	});

	it('should create single node for top-level deck', () => {
		const cards = [createCard({ uuid: '1', decks: ['Maths'] })];
		const tree = buildDeckTree(cards);
		expect(tree).toHaveLength(1);
		expect(tree[0].name).toBe('Maths');
		expect(tree[0].fullPath).toBe('Maths');
		expect(tree[0].totalCards).toBe(1);
		expect(tree[0].dueNow).toBe(0);
		expect(tree[0].children).toEqual([]);
	});

	it('should create parent and child nodes for nested deck', () => {
		const cards = [createCard({ uuid: '1', decks: ['Maths::LA'] })];
		const tree = buildDeckTree(cards);
		expect(tree).toHaveLength(1);
		expect(tree[0].name).toBe('Maths');
		expect(tree[0].fullPath).toBe('Maths');
		expect(tree[0].totalCards).toBe(1);
		expect(tree[0].children).toHaveLength(1);
		expect(tree[0].children[0].name).toBe('LA');
		expect(tree[0].children[0].fullPath).toBe('Maths::LA');
		expect(tree[0].children[0].totalCards).toBe(1);
	});

	it('should aggregate counts for multiple cards in same deck', () => {
		const cards = [
			createCard({ uuid: '1', decks: ['Maths'] }),
			createCard({ uuid: '2', decks: ['Maths'] }),
		];
		const tree = buildDeckTree(cards);
		expect(tree[0].totalCards).toBe(2);
	});

	it('should count due cards correctly', () => {
		const past = new Date(Date.now() - 86400000).toISOString();
		const cards = [
			createCard({ uuid: '1', decks: ['Maths'], due: past }),
			createCard({ uuid: '2', decks: ['Maths'] }),
		];
		const tree = buildDeckTree(cards);
		expect(tree[0].dueNow).toBe(1);
		expect(tree[0].totalCards).toBe(2);
	});

	it('should handle multiple sibling decks under same parent', () => {
		const cards = [
			createCard({ uuid: '1', decks: ['Maths::LA'] }),
			createCard({ uuid: '2', decks: ['Maths::Calc'] }),
		];
		const tree = buildDeckTree(cards);
		expect(tree).toHaveLength(1);
		expect(tree[0].name).toBe('Maths');
		expect(tree[0].children).toHaveLength(2);
		expect(tree[0].children[0].name).toBe('Calc');
		expect(tree[0].children[1].name).toBe('LA');
	});

	it('should create Uncategorized node for cards with no decks', () => {
		const cards = [createCard({ uuid: '1', decks: undefined })];
		const tree = buildDeckTree(cards);
		expect(tree).toHaveLength(1);
		expect(tree[0].name).toBe('Uncategorized');
		expect(tree[0].fullPath).toBe('Uncategorized');
		expect(tree[0].totalCards).toBe(1);
	});

	it('should create Uncategorized node for cards with empty decks', () => {
		const cards = [createCard({ uuid: '1', decks: [] })];
		const tree = buildDeckTree(cards);
		expect(tree).toHaveLength(1);
		expect(tree[0].name).toBe('Uncategorized');
		expect(tree[0].totalCards).toBe(1);
	});

	it('should show both Uncategorized and regular decks when mixed', () => {
		const cards = [
			createCard({ uuid: '1', decks: undefined }),
			createCard({ uuid: '2', decks: ['Maths'] }),
			createCard({ uuid: '3', decks: [] }),
			createCard({ uuid: '4', decks: ['CS'] }),
		];
		const tree = buildDeckTree(cards);
		expect(tree).toHaveLength(3);
		// Sorted alphabetically: CS, Maths, Uncategorized
		expect(tree.map((n) => n.name)).toEqual(['CS', 'Maths', 'Uncategorized']);
		expect(tree[0].totalCards).toBe(1); // CS
		expect(tree[1].totalCards).toBe(1); // Maths
		expect(tree[2].totalCards).toBe(2); // Uncategorized (2 cards)
	});

	it('should handle cards with multiple decks', () => {
		const cards = [createCard({ uuid: '1', decks: ['Maths', 'CS'] })];
		const tree = buildDeckTree(cards);
		expect(tree).toHaveLength(2);
		const mathsNode = tree.find((n) => n.name === 'Maths');
		const csNode = tree.find((n) => n.name === 'CS');
		expect(mathsNode?.totalCards).toBe(1);
		expect(csNode?.totalCards).toBe(1);
	});

	it('should aggregate parent counts across multiple children', () => {
		const cards = [
			createCard({ uuid: '1', decks: ['Maths::LA'] }),
			createCard({ uuid: '2', decks: ['Maths::Calc'] }),
		];
		const tree = buildDeckTree(cards);
		const mathsNode = tree.find((n) => n.name === 'Maths');
		expect(mathsNode?.totalCards).toBe(2);
	});

	it('should exclude non-ACTIVE cards', () => {
		const cards = [
			createCard({ uuid: '1', decks: ['Maths'], status: 'DELETED' }),
			createCard({ uuid: '2', decks: ['Maths'], status: 'ACTIVE' }),
		];
		const tree = buildDeckTree(cards);
		expect(tree).toHaveLength(1);
		expect(tree[0].totalCards).toBe(1);
	});

	it('should sort top-level nodes alphabetically', () => {
		const cards = [
			createCard({ uuid: '1', decks: ['Zebra'] }),
			createCard({ uuid: '2', decks: ['Apple'] }),
			createCard({ uuid: '3', decks: ['Maths'] }),
		];
		const tree = buildDeckTree(cards);
		expect(tree.map((n) => n.name)).toEqual(['Apple', 'Maths', 'Zebra']);
	});

	it('should sort children alphabetically', () => {
		const cards = [
			createCard({ uuid: '1', decks: ['Maths::Zebra'] }),
			createCard({ uuid: '2', decks: ['Maths::Apple'] }),
		];
		const tree = buildDeckTree(cards);
		expect(tree[0].children.map((n) => n.name)).toEqual(['Apple', 'Zebra']);
	});

	it('should expand top-level nodes by default', () => {
		const cards = [createCard({ uuid: '1', decks: ['Maths::LA'] })];
		const tree = buildDeckTree(cards);
		expect(tree[0].isExpanded).toBe(true);
	});

	it('should handle deeply nested decks', () => {
		const cards = [createCard({ uuid: '1', decks: ['Maths::LA::Matrices::Eigenvalues'] })];
		const tree = buildDeckTree(cards);
		expect(tree[0].name).toBe('Maths');
		expect(tree[0].children[0].name).toBe('LA');
		expect(tree[0].children[0].children[0].name).toBe('Matrices');
		expect(tree[0].children[0].children[0].children[0].name).toBe('Eigenvalues');
	});

	it('should aggregate due counts at parent level', () => {
		const past = new Date(Date.now() - 86400000).toISOString();
		const cards = [
			createCard({ uuid: '1', decks: ['Maths::LA'], due: past }),
			createCard({ uuid: '2', decks: ['Maths::Calc'] }),
		];
		const tree = buildDeckTree(cards);
		const mathsNode = tree.find((n) => n.name === 'Maths');
		expect(mathsNode?.dueNow).toBe(1);
		expect(mathsNode?.totalCards).toBe(2);
	});
});
