import { BaseEngine } from '@/modules/engines/BaseEngine';
import type { Flashcard } from '@/schemas/flashcard';
import type { FSRSParams } from '@/schemas/srs';
import { Card, FSRS, FSRSParameters, generatorParameters, Rating, State } from 'ts-fsrs';
import { DEFAULT_FSRS } from '@/utils/constants';
import { IEngine } from '@/interfaces/IEngine';

export class FsrsEngine extends BaseEngine<Flashcard> implements IEngine<Flashcard> {
  private readonly STATE_PRIORITY: Record<number, number> = {
    [State.Learning]: 0,
    [State.Relearning]: 1,
    [State.Review]: 2,
    [State.New]: 3,
  };

  private fsrs: FSRS;

  constructor() {
    super();
    this.fsrs = new FSRS(generatorParameters());
  }

  /**
   * Sorts flashcards in-place by due date + state priority.
   * @param list Flashcards to sort (mutated in-place)
   * @returns The same sorted array reference
   */
  sort: (list: Flashcard[]) => Flashcard[] = (list) => {
    return list.sort((a, b) => {
      const dueDiff =
        new Date(a.srs.due).getTime() - new Date(b.srs.due).getTime();
      if (dueDiff !== 0) return dueDiff;

      const priorityA = this.STATE_PRIORITY[a.srs.state] ?? 99;
      const priorityB = this.STATE_PRIORITY[b.srs.state] ?? 99;
      return priorityA - priorityB;
    });
  }

  /**
   * Calculates updated FSRS parameters based on a user rating.
   * @returns Updated Flashcard entity
   */
  calculate: (item: Flashcard, score: Exclude<Rating, 0>) => Flashcard = (item, score) => {
    const params = item.srs;
    const card: Card = this.mapToFsrsCard(params);
    const reviewTime = new Date();

    const record = this.fsrs.repeat(card, reviewTime);
    const updatedCard = record[score].card;

    return {
      ...item,
      srs: this.mapFromFsrsCard(updatedCard)
    }
  }

  /**
   * Returns default FSRS parameters for a new card.
   */
  getInitialState(): FSRSParams {
    return { ...DEFAULT_FSRS };
  }

  /**
   * Maps internal FSRSStats to ts-fsrs Card object.
   */
  private mapToFsrsCard(params: FSRSParams): Card {
    return {
      due: new Date(params.due),
      stability: params.stability,
      difficulty: params.difficulty,
      elapsed_days: params.elapsed_days,
      scheduled_days: params.scheduled_days,
      learning_steps: params.learning_steps,
      reps: params.reps,
      lapses: params.lapses,
      state: params.state,
      last_review: params.last_review ? new Date(params.last_review) : undefined,
    };
  }

  /**
   * Maps ts-fsrs Card object back to internal FSRSStats.
   */
  private mapFromFsrsCard(card: Card): FSRSParams {
    return {
      stability: card.stability,
      difficulty: card.difficulty,
      elapsed_days: card.elapsed_days,
      scheduled_days: card.scheduled_days,
      learning_steps: card.learning_steps,
      reps: card.reps,
      lapses: card.lapses,
      state: card.state,
      last_review: card.last_review ? card.last_review.toISOString() : null,
      due: card.due.toISOString(),
    };
  }

  /**
   * Updates the underlying FSRS algorithm parameters.
   */
  updateParameters(params: Partial<FSRSParameters>): void {
    this.fsrs.parameters = params;
  }
}
