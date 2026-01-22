import { z } from 'zod';

// Individual context types
export interface ReviewContext {
  currentSessionId: string;
  currentCardIndex: number;
  queueSize: number;
  sessionStartTime: number;
}

export interface DashboardContext {
  selectedPeriod: 'today' | '7days' | '30days';
  showDetails: boolean;
}

// Enhanced navigation state types for unified interface
export interface NavigationState {
  currentView: 'dashboard' | 'review';
  reviewContext: ReviewContext | null;
  dashboardContext: DashboardContext | null;
}

// Zod schema for runtime validation
export const NavigationStateSchema = z.object({
  currentView: z.enum(['dashboard', 'review']),
  reviewContext: z.object({
    currentSessionId: z.string().uuid(),
    currentCardIndex: z.number().int().min(0),
    queueSize: z.number().int().min(0),
    sessionStartTime: z.number().int().positive(),
  }).nullable(),
  dashboardContext: z.object({
    selectedPeriod: z.enum(['today', '7days', '30days']),
    showDetails: z.boolean(),
  }).nullable(),
});

export interface INavigationManager {
  /**
    * Initializes the navigation state to dashboard view.
    * Loads persisted state if available.
    */
  initialize(): Promise<void>;

  /**
    * Navigates to the specified view.
    * @param view - Target view ("dashboard" or "review")
    * @param context - Optional context data for target view
    */
  navigateTo(
    view: 'dashboard' | 'review',
    context?: ReviewContext | DashboardContext,
  ): Promise<void>;

  /**
    * Returns the current navigation state.
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
