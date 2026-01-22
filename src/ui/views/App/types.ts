// Import navigation types from stores
import type { ReviewContext, DashboardContext, NavigationState } from '@/ui/stores/types';

export interface INavigationManager {
  /**
   * Initializes the navigation state to dashboard view.
   * Loads persisted state if available.
   */
  initialize(): Promise<void>;

  /**
   * Navigates to the specified view.
   * @param view - Target view ("dashboard" or "review")
   * @param context - Optional context data for the target view
   */
  navigateTo(
    view: 'dashboard' | 'review',
    context?: ReviewContext | DashboardContext
  ): Promise<void>;

  /**
   * Returns the current navigation state.
   * Svelte components subscribe to this for reactivity.
   */
  getState(): NavigationState;

  /**
   * Updates the review context (e.g., during session).
   * @param context - New review context
   */
  updateReviewContext(context: ReviewContext): void;

  /**
   * Updates the dashboard context (e.g., period selection).
   * @param context - New dashboard context
   */
  updateDashboardContext(context: DashboardContext): void;

  /**
   * Opens the unified view in a new ribbon-icon leaf.
   * @returns Promise that resolves when view is opened
   */
  openUnifiedView(): Promise<void>;

  /**
   * Closes the unified view.
   */
  closeUnifiedView(): void;

  /**
   * Persists the current navigation state to plugin settings.
   * Called on state changes.
   */
  save(): Promise<void>;

  /**
   * Loads navigation state from plugin settings.
   */
  load(): Promise<void>;
}