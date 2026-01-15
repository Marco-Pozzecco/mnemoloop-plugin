import { Notice } from 'obsidian';

/**
 * Notification Manager for the Knowledge Accelerator plugin
 *
 * Provides methods for:
 * - Showing toast-style notifications with emojis
 * - Displaying progress in the Obsidian status bar
 * - Clearing status bar indicators
 */

export interface NotificationOptions {
	/** Duration in milliseconds (0 for persistent notice) */
	duration?: number;
	/** Emoji icon for the notification */
	icon?: string;
}

export interface ProgressOptions {
	/** Current progress value */
	current: number;
	/** Total value */
	total: number;
	/** Progress message */
	message?: string;
}

export class NotificationManager {
	private statusBar: HTMLElement | null = null;
	private activeNotice: Notice | null = null;

	constructor(statusBar?: HTMLElement) {
		if (statusBar) {
			this.statusBar = statusBar;
		}
	}

	/**
	 * Sets the status bar instance
	 * @param statusBar - The Obsidian status bar element
	 */
	setStatusBar(statusBar: HTMLElement): void {
		this.statusBar = statusBar;
	}

	/**
	 * Shows a notification to the user
	 * @param message - The message to display
	 * @param type - The type of notification (info, success, warning, error)
	 * @param options - Additional options
	 */
	show(
		message: string,
		type: 'info' | 'success' | 'warning' | 'error' = 'info',
		options: NotificationOptions = {},
	): void {
		const { duration = 3000, icon } = options;

		// Map notification types to emojis
		const iconMap: Record<typeof type, string> = {
			info: icon || 'ℹ️',
			success: icon || '✅',
			warning: icon || '⚠️',
			error: icon || '❌',
		};

		const displayIcon = iconMap[type];
		const fullMessage = `${displayIcon} ${message}`;

		// Clear existing notice if present
		if (this.activeNotice) {
			this.activeNotice.hide();
		}

		// Create new notice
		this.activeNotice = new Notice(fullMessage, duration);

		// Clear reference after duration
		if (duration > 0) {
			setTimeout(() => {
				if (this.activeNotice) {
					this.activeNotice = null;
				}
			}, duration + 100);
		}
	}

	/**
	 * Shows an info notification
	 */
	info(message: string, options?: NotificationOptions): void {
		this.show(message, 'info', options);
	}

	/**
	 * Shows a success notification
	 */
	success(message: string, options?: NotificationOptions): void {
		this.show(message, 'success', options);
	}

	/**
	 * Shows a warning notification
	 */
	warning(message: string, options?: NotificationOptions): void {
		this.show(message, 'warning', options);
	}

	/**
	 * Shows an error notification
	 */
	error(message: string, options?: NotificationOptions): void {
		this.show(message, 'error', options);
	}

	/**
	 * Updates the status bar with progress information
	 * @param options - Progress options with current, total, and optional message
	 */
	updateProgress(options: ProgressOptions): void {
		if (!this.statusBar) {
			console.warn('Status bar not available for progress updates');
			return;
		}

		const { current, total, message } = options;
		const percentage = Math.round((current / total) * 100);

		const progressBar = this.createProgressBar(percentage, 20);
		const displayMessage = message
			? `${progressBar} ${message} (${current}/${total})`
			: `${progressBar} ${percentage}%`;

		this.statusBar.textContent = displayMessage;
	}

	/**
	 * Clears the status bar text
	 */
	clearStatusBar(): void {
		if (this.statusBar) {
			this.statusBar.textContent = '';
		}
	}

	/**
	 * Sets custom text on the status bar
	 * @param text - The text to display
	 */
	setStatusBarText(text: string): void {
		if (this.statusBar) {
			this.statusBar.textContent = text;
		}
	}

	/**
	 * Creates a visual progress bar string
	 * @param percentage - Progress percentage (0-100)
	 * @param width - Width of the progress bar in characters
	 * @returns ASCII progress bar string
	 */
	private createProgressBar(percentage: number, width: number): string {
		const filled = Math.round((percentage / 100) * width);
		const empty = width - filled;

		// Use block characters for progress bar
		const filledBar = '█'.repeat(filled);
		const emptyBar = '░'.repeat(empty);

		return `${filledBar}${emptyBar}`;
	}

	/**
	 * Clears any active notification
	 */
	clearNotification(): void {
		if (this.activeNotice) {
			this.activeNotice.hide();
			this.activeNotice = null;
		}
	}

	/**
	 * Cleans up resources
	 */
	destroy(): void {
		this.clearNotification();
		this.clearStatusBar();
		this.statusBar = null;
	}
}
