import { IReviewQueue } from '@/interfaces/IReviewQueue';
import { EventBus, FlashcardReviewSessionStartEvent } from '@/modules/events';
import { FlashcardReviewQueue } from '@/modules/review-queues/FlashcardReviewQueue';
import { CardStatus, FlashcardMetadata } from '@/schemas';
import { IndexKey } from '@/types/indexes';
import { settingsStore } from '@/ui/store/settings.store';
import { uiStore, UIStore } from '@/ui/store/ui.store';
import { FSRSParameters } from 'ts-fsrs';
import { sessionStore, SessionStore } from '../store/session.store';

interface IDashboardController {
	startReview: (type: IndexKey, deckFilter?: string) => Promise<void>;
}

export class DashboardController implements IDashboardController {
	private _uiStore: UIStore = uiStore;
	private _sessionStore: SessionStore = sessionStore;

	constructor() {}

	startReview: (type: IndexKey, deckFilter?: string) => Promise<void> = async (
		type,
		deckFilter,
	) => {
		switch (type) {
			case IndexKey.flashcard:
				return await this.startFlashcardReview(deckFilter);
		}
	};

	private async startFlashcardReview(deckFilter?: string) {
		this._uiStore.isLoading = true;

		const fsrsParams = settingsStore.currentSettings.flashcard.fsrs;

		const predicate = (entity: FlashcardMetadata) => {
			const conditions = [entity.status === CardStatus.ACTIVE, new Date(entity.due) <= new Date()];

			if (deckFilter) {
				conditions.push(entity.decks.some((deck) => deck.includes(deckFilter)));
			}

			return conditions.every((v) => v === true);
		};
		const list = new FlashcardReviewQueue(
			predicate,
			fsrsParams as unknown as Partial<FSRSParameters>,
		);

		this._sessionStore.queue = list as IReviewQueue<unknown>;

		this._sessionStore.startSession('flashcard', deckFilter);

		EventBus.instance.publish(
			new FlashcardReviewSessionStartEvent({
				session_id: this._sessionStore.state.session_id!,
				start_time: this._sessionStore.state.start_time!,
			}),
		);

		this._uiStore.isLoading = false;
		this._uiStore.currentView = 'review';
	}
}
