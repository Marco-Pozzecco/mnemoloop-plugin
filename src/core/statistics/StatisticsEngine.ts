import { FlashcardMetadata } from '../indexer/schema/IndexerSchema';
import { StatisticsSummary } from './schema/StatisticsSchema';

export class StatisticsEngine {
	calculateRetention(cards: FlashcardMetadata[]): number {
		const reviewedCards = cards.filter(
			(card) => card.srs.reps > 0 && card.srs.last_review !== null,
		);

		if (reviewedCards.length === 0) {
			return 0;
		}

		// Simple retention calculation based on state progression
		const matureCards = reviewedCards.filter((card) => card.srs.state >= 2);
		return matureCards.length / reviewedCards.length;
	}

	calculateDifficultyDistribution(cards: FlashcardMetadata[]): Map<number, number> {
		const distribution = new Map<number, number>();

		for (const card of cards) {
			const difficulty = Math.round(card.srs.difficulty);
			distribution.set(difficulty, (distribution.get(difficulty) || 0) + 1);
		}

		return distribution;
	}

	calculateTotalLearned(cards: FlashcardMetadata[]): number {
		return cards.filter((card) => card.srs.state > 0).length;
	}

	calculateDueToday(cards: FlashcardMetadata[]): number {
		const today = new Date().toISOString().split('T')[0];
		return cards.filter((card) => card.status === 'ACTIVE' && card.srs.next_review <= today).length;
	}

	generateSummary(cards: FlashcardMetadata[]): StatisticsSummary {
		return {
			retention_rate: this.calculateRetention(cards),
			difficulty_dist: Object.fromEntries(this.calculateDifficultyDistribution(cards)),
			total_learned: this.calculateTotalLearned(cards),
			due_today: this.calculateDueToday(cards),
		};
	}
}
