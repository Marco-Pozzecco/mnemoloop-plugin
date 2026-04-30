import { IReviewQueue } from '@/interfaces/IReviewQueue';
import { EventBus, FlashcardReviewSessionStartEvent } from '@/modules/events';
import { FlashcardReviewQueue } from '@/modules/review-queues/FlashcardReviewQueue';
import { CardStatus, FlashcardMetadata } from '@/schemas';
import { IndexKey } from '@/types/indexes';
import { uiStore, UIStore } from '@/ui/store/ui.store';
import { sessionStore, SessionStore } from '../store/session.store';

interface IDashboardController {
	startReview: (type: IndexKey) => Promise<void>;
}

export class DashboardController implements IDashboardController {
	private _uiStore: UIStore = uiStore;
	private _sessionStore: SessionStore = sessionStore;

	constructor() {}

	startReview: (type: IndexKey) => Promise<void> = async (type) => {
		switch (type) {
			case IndexKey.flashcard:
				return await this.startFlashcardReview();
		}
	};

	private async startFlashcardReview() {
		this._uiStore.isLoading = true;

		const predicate = (entity: FlashcardMetadata) =>
			entity.status === CardStatus.ACTIVE && new Date(entity.due) <= new Date();
		const list = new FlashcardReviewQueue(predicate);

		this._sessionStore.queue = list as IReviewQueue<unknown>;

		this._sessionStore.startSession('flashcard');

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
