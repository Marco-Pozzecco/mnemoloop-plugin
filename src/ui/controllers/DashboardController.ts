import { FlashcardReviewQueue } from '@/modules/review-queues/FlashcardReviewQueue';
import { CardStatus, Flashcard } from '@/schemas';
import { uiStore, UIStore } from '@/ui/store/ui.store';
import { sessionStore, SessionStore } from '../store/session.store';
import { Plugin } from 'obsidian';
import { IReviewQueue } from '@/interfaces/IReviewQueue';
import { Indexes, IndexKey } from '@/main';
import { DashboardStats } from '../components/views/Dashboard/Dashboard.types';

interface IDashboardController {
  stats: DashboardStats;
  history: Record<string, unknown>;
  startReview: (type: IndexKey) => Promise<void>;
}

export class DashboardController implements IDashboardController {
  private _plugin: Plugin;
  private _uiStore: UIStore = uiStore;
  private _sessionStore: SessionStore = sessionStore;
  private _indexes: Indexes;

  constructor(plugin: Plugin, indexes: Indexes) {
    this._plugin = plugin;
    this._indexes = indexes;
  }

  get stats(): DashboardStats {
    return { cardsLearnedToday: 0, dailyGoal: 20, dueCount: 1, estimatedTimeMinutes: 0, progressData: [], retentionRate: 0, streakDays: 0, totalCards: 20 }; // TODO: implement
  };

  get history(): Record<string, unknown> {
    return {}; // TODO: implement
  }

  startReview: (type: IndexKey) => Promise<void> = async (type) => {
    switch (type) {
      case IndexKey.FLASHCARD:
        return await this.startFlashcardReview();
    }
  };

  private async startFlashcardReview() {
    this._uiStore.isLoading = true;

    const index = this._indexes.get(IndexKey.FLASHCARD);

    if (!index) {
      throw new Error(`index of kind::${IndexKey.FLASHCARD} not initialized`)
    }

    const predicate = (entity: Flashcard) => entity.status === CardStatus.ACTIVE && new Date(entity.due) <= new Date();
    const list = new FlashcardReviewQueue(this._plugin, index, predicate);

    this._sessionStore.queue = list as IReviewQueue<unknown>;

    this._uiStore.isLoading = false;
    this._uiStore.currentView = "review";
  };
}
