import type { Flashcard } from '../core/parser/types';

/**
 * Represents the reactive state of the dashboard.
 */
export interface DashboardState {
	totalCards: number;
	retentionRate: number;
	dueCount: number;
	dailyGoal: number;
	progressData: Array<{
		date: string;
		completed: number;
		target: number;
	}>;
}

/**
 * Represents an active flashcard review session.
 */
export interface ReviewSession {
	sessionId: string;
	queue: Flashcard[];
	currentIndex: number;
	startTime: string;
	isComplete: boolean;
	stats: {
		correct: number;
		incorrect: number;
		total: number;
	};
}

/**
 * UI Notification types.
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Represents a UI alert or notification.
 */
export interface Notification {
	id: string;
	type: NotificationType;
	message: string;
	duration?: number;
}

/**
 * Possible view states for the plugin UI.
 */
export type ViewState = 'dashboard' | 'review' | 'settings' | 'stats';

/**
 * Represents the loading state of a component or view.
 */
export interface LoadingState {
	isLoading: boolean;
	message?: string;
	progress?: number;
}

/**
 * Represents an error state in the UI.
 */
export interface ErrorState {
	hasError: boolean;
	message: string;
	code?: string;
	retry?: () => void;
}

/**
 * Common interface for component properties.
 */
export interface BaseComponentProps {
	className?: string;
	id?: string;
	style?: string;
}

/**
 * Props for components that handle actions.
 */
export interface ActionComponentProps extends BaseComponentProps {
	disabled?: boolean;
	loading?: boolean;
	onClick?: (event: MouseEvent) => void;
}

/**
 * Touch gesture data for mobile interactions.
 */
export interface GestureData {
	type: 'swipe' | 'tap' | 'hold';
	direction?: 'left' | 'right' | 'up' | 'down';
	distance?: number;
	velocity?: number;
}
