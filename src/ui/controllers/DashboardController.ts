import { FlashcardReviewQueue } from '@/modules/review-queues/FlashcardReviewQueue';
import { CardStatus, Flashcard, Stats } from '@/schemas';
import { uiStore, UIStore } from '@/ui/store/ui.store';
import { sessionStore, SessionStore } from '../store/session.store';
import { IReviewQueue } from '@/interfaces/IReviewQueue';
import { Indexes, IndexKey } from '@/types/indexes';
import { EventBus } from '@/modules/event-bus/EventBus';
import { EventType, SessionStartEvent } from '@/types/events';

interface IDashboardController {
	startReview: (type: IndexKey) => Promise<void>;
}

export class DashboardController implements IDashboardController {
	private _uiStore: UIStore = uiStore;
	private _sessionStore: SessionStore = sessionStore;
	private _indexes: Indexes;

	constructor(indexes: Indexes) {
		this._indexes = indexes;
	}

	startReview: (type: IndexKey) => Promise<void> = async (type) => {
		switch (type) {
			case IndexKey.flashcard:
				return await this.startFlashcardReview();
		}
	};

	private async startFlashcardReview() {
		this._uiStore.isLoading = true;

		const index = this._indexes.get(IndexKey.flashcard);

		if (!index) {
			throw new Error(`index of kind::${IndexKey.flashcard} not initialized`);
		}

		const predicate = (entity: Flashcard) =>
			entity.status === CardStatus.ACTIVE && new Date(entity.due) <= new Date();
		const list = new FlashcardReviewQueue(index, predicate);

		this._sessionStore.queue = list as IReviewQueue<unknown>;

		this._sessionStore.startSession('flashcard');

		const sessionEvent: SessionStartEvent = {
			event_type: EventType.SessionStart,
			created_at: new Date(),
			data: {
				session_id: this._sessionStore.state.session_id!,
				review_type: 'flashcard',
				start_time: this._sessionStore.state.start_time!,
			},
		};
		EventBus.instance.publish(sessionEvent);

		this._uiStore.isLoading = false;
		this._uiStore.currentView = 'review';
	}
}
