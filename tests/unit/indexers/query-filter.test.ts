import { describe, expect, it } from 'vitest';
import { buildFlashcardQueryPredicate } from '@/modules/indexers/FlashcardIndexer';
import { FlashcardMetadata } from '@/schemas';
import { DEFAULT_FSRS } from '@/utils/constants';

function createCard(overrides: Partial<FlashcardMetadata> = {}): FlashcardMetadata {
	const now = new Date().toISOString();
	return {
		...DEFAULT_FSRS,
		uuid: 'test-uuid',
		source: null,
		status: 'ACTIVE',
		due: now,
		file: 'test.md',
		created_at: now,
		updated_at: now,
		deleted_at: null,
		...overrides,
	} as FlashcardMetadata;
}

describe('FlashcardIndexQuery deck filtering', () => {
	it('should return all cards when no deckFilter is set', () => {
		const cards = [
			createCard({ uuid: '1', decks: ['Maths'] }),
			createCard({ uuid: '2', decks: undefined }),
			createCard({ uuid: '3', decks: [] }),
		];
		const predicate = buildFlashcardQueryPredicate({ predicate: () => true });
		const result = cards.filter(predicate);
		expect(result).toHaveLength(3);
	});

	it('should filter by deck with exact match', () => {
		const cards = [
			createCard({ uuid: '1', decks: ['Maths'] }),
			createCard({ uuid: '2', decks: ['CS'] }),
		];
		const predicate = buildFlashcardQueryPredicate({
			predicate: () => true,
			deckFilter: 'Maths',
		});
		const result = cards.filter(predicate);
		expect(result).toHaveLength(1);
		expect(result[0].uuid).toBe('1');
	});

	it('should filter by deck with prefix match for children', () => {
		const cards = [
			createCard({ uuid: '1', decks: ['Maths::LA'] }),
			createCard({ uuid: '2', decks: ['CS'] }),
		];
		const predicate = buildFlashcardQueryPredicate({
			predicate: () => true,
			deckFilter: 'Maths',
		});
		const result = cards.filter(predicate);
		expect(result).toHaveLength(1);
		expect(result[0].uuid).toBe('1');
	});

	it('should include deeply nested children in prefix match', () => {
		const cards = [
			createCard({ uuid: '1', decks: ['Maths::LA::Matrices'] }),
			createCard({ uuid: '2', decks: ['Maths::Calc'] }),
			createCard({ uuid: '3', decks: ['CS'] }),
		];
		const predicate = buildFlashcardQueryPredicate({
			predicate: () => true,
			deckFilter: 'Maths',
		});
		const result = cards.filter(predicate);
		expect(result).toHaveLength(2);
		expect(result.map((c) => c.uuid)).toContain('1');
		expect(result.map((c) => c.uuid)).toContain('2');
	});

	it('should match exact leaf deck filter', () => {
		const cards = [
			createCard({ uuid: '1', decks: ['Maths::LA'] }),
			createCard({ uuid: '2', decks: ['Maths::Calc'] }),
		];
		const predicate = buildFlashcardQueryPredicate({
			predicate: () => true,
			deckFilter: 'Maths::LA',
		});
		const result = cards.filter(predicate);
		expect(result).toHaveLength(1);
		expect(result[0].uuid).toBe('1');
	});

	it('should include grandchildren of leaf deck filter', () => {
		const cards = [createCard({ uuid: '1', decks: ['Maths::LA::Matrices'] })];
		const predicate = buildFlashcardQueryPredicate({
			predicate: () => true,
			deckFilter: 'Maths::LA',
		});
		expect(cards.filter(predicate)).toHaveLength(1);
	});

	it('should match when any of multiple decks matches filter', () => {
		const cards = [
			createCard({ uuid: '1', decks: ['Maths::LA', 'CS'] }),
			createCard({ uuid: '2', decks: ['History'] }),
		];
		const predicate = buildFlashcardQueryPredicate({
			predicate: () => true,
			deckFilter: 'Maths',
		});
		const result = cards.filter(predicate);
		expect(result).toHaveLength(1);
		expect(result[0].uuid).toBe('1');
	});

	it('should not match partial string (not prefix)', () => {
		const cards = [createCard({ uuid: '1', decks: ['MathsHistory'] })];
		const predicate = buildFlashcardQueryPredicate({
			predicate: () => true,
			deckFilter: 'Maths',
		});
		expect(cards.filter(predicate)).toHaveLength(0);
	});

	it('should match Uncategorized for cards with undefined decks', () => {
		const cards = [
			createCard({ uuid: '1', decks: undefined }),
			createCard({ uuid: '2', decks: ['Maths'] }),
		];
		const predicate = buildFlashcardQueryPredicate({
			predicate: () => true,
			deckFilter: 'Uncategorized',
		});
		const result = cards.filter(predicate);
		expect(result).toHaveLength(1);
		expect(result[0].uuid).toBe('1');
	});

	it('should match Uncategorized for cards with empty decks', () => {
		const cards = [
			createCard({ uuid: '1', decks: [] }),
			createCard({ uuid: '2', decks: ['Maths'] }),
		];
		const predicate = buildFlashcardQueryPredicate({
			predicate: () => true,
			deckFilter: 'Uncategorized',
		});
		const result = cards.filter(predicate);
		expect(result).toHaveLength(1);
		expect(result[0].uuid).toBe('1');
	});

	it('should not include Uncategorized cards in normal deck filter', () => {
		const cards = [
			createCard({ uuid: '1', decks: undefined }),
			createCard({ uuid: '2', decks: [] }),
			createCard({ uuid: '3', decks: ['Maths'] }),
		];
		const predicate = buildFlashcardQueryPredicate({
			predicate: () => true,
			deckFilter: 'Maths',
		});
		const result = cards.filter(predicate);
		expect(result).toHaveLength(1);
		expect(result[0].uuid).toBe('3');
	});

	it('should apply base predicate before deck filter', () => {
		const cards = [
			createCard({ uuid: '1', decks: ['Maths'], status: 'ACTIVE' }),
			createCard({ uuid: '2', decks: ['Maths'], status: 'PAUSED' }),
		];
		const predicate = buildFlashcardQueryPredicate({
			predicate: (f) => f.status === 'ACTIVE',
			deckFilter: 'Maths',
		});
		const result = cards.filter(predicate);
		expect(result).toHaveLength(1);
		expect(result[0].uuid).toBe('1');
	});

	it('should not break when base predicate excludes all cards', () => {
		const cards = [createCard({ uuid: '1', decks: ['Maths'] })];
		const predicate = buildFlashcardQueryPredicate({
			predicate: () => false,
			deckFilter: 'Maths',
		});
		expect(cards.filter(predicate)).toHaveLength(0);
	});
});
