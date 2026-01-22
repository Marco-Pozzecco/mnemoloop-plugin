import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type { DashboardStats } from '../views/Dashboard/types';

/**
 * Statistics Store for reactive dashboard statistics.
 * Provides reactive updates when statistics data changes.
 */
export class StatisticsStore {
  private readonly _state: Writable<DashboardStats | null>;

  constructor(initialStats: DashboardStats | null = null) {
    this._state = writable(initialStats);
  }

  /**
   * Subscribe to statistics changes
   */
  subscribe(run: (value: DashboardStats | null) => void) {
    return this._state.subscribe(run);
  }

  /**
   * Update statistics data
   */
  set(stats: DashboardStats): void {
    this._state.set(stats);
  }

  /**
   * Get current statistics value
   */
  get current(): DashboardStats | null {
    let value: DashboardStats | null = null;
    this._state.subscribe((v) => value = v)();
    return value;
  }

  /**
   * Clear statistics (set to null)
   */
  clear(): void {
    this._state.set(null);
  }

  /**
   * Derived stores for individual statistics values
   */
  get totalCards(): Readable<number> {
    return derived(this._state, (stats) => stats?.totalCards ?? 0);
  }

  get retentionRate(): Readable<number> {
    return derived(this._state, (stats) => stats?.retentionRate ?? 0);
  }

  get dueCount(): Readable<number> {
    return derived(this._state, (stats) => stats?.dueCount ?? 0);
  }

  get dailyGoal(): Readable<number> {
    return derived(this._state, (stats) => stats?.dailyGoal ?? 20);
  }

  get streakDays(): Readable<number> {
    return derived(this._state, (stats) => stats?.streakDays ?? 0);
  }

  get cardsLearnedToday(): Readable<number> {
    return derived(this._state, (stats) => stats?.cardsLearnedToday ?? 0);
  }

  get estimatedTimeMinutes(): Readable<number> {
    return derived(this._state, (stats) => stats?.estimatedTimeMinutes ?? 0);
  }

  get progressData(): Readable<DashboardStats['progressData']> {
    return derived(this._state, (stats) => stats?.progressData ?? []);
  }

  /**
   * Check if daily goal is met
   */
  get isDailyGoalMet(): Readable<boolean> {
    return derived([this.cardsLearnedToday, this.dailyGoal], 
      ([$cardsLearnedToday, $dailyGoal]) => $cardsLearnedToday >= $dailyGoal
    );
  }

  /**
   * Get completion percentage for today's goal
   */
  get dailyGoalProgress(): Readable<number> {
    return derived([this.cardsLearnedToday, this.dailyGoal], 
      ([$cardsLearnedToday, $dailyGoal]) => $dailyGoal > 0 ? Math.min(($cardsLearnedToday / $dailyGoal) * 100, 100) : 0
    );
  }
}

// Global statistics store instance
export const statisticsStore = new StatisticsStore();