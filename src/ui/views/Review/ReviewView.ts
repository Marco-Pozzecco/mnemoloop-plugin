import type { SvelteComponent } from 'svelte';
import { TFile, TAbstractFile } from 'obsidian';
import { PluginView } from '@/obsidian/PluginView';
import { uiStore } from '@/ui/stores/UIStore';
import type { ReviewProps } from './types';
import Review from './Review.svelte';
import { ReviewController } from './ReviewController';
import type { IReviewController } from '@/contracts/UIEngineContract';

export const REVIEW_VIEW_TYPE = 'knowledge-accelerator-review';

/**
 * Review View implementation for Obsidian.
 *
 * This view provides the focused flashcard review interface with:
 * - Card display (front/back)
 * - Rating controls (Again, Hard, Good, Easy)
 * - Session progress tracking
 * - Keyboard shortcuts for efficient reviewing
 */
export class ReviewView extends PluginView {
	/** Unique view type identifier */
	protected viewType = REVIEW_VIEW_TYPE;
	/** Display text for the view tab */
	protected displayText = 'Review';
	/** Icon for the view tab */
	public icon = 'brain-circuit';

	/** Review controller instance */
	private reviewController?: IReviewController;
	/** Track the currently edited file for refresh */
	private editedFilePath: string | null = null;

	/**
	 * Creates and mounts the Review Svelte component
	 *
	 * @param container - The DOM element to mount the component into
	 * @returns The mounted Svelte component
	 */
	protected createSvelteComponent(container: Element): SvelteComponent {
		// Initialize review controller
		this.reviewController = new ReviewController(this.app, this.indexManager, this.sessionStore);

		// Create component props
		const props: ReviewProps = {
			app: this.app,
			disabled: false,
			onShowAnswer: this.sessionStore.showAnswer,
			onSubmitRating: (rating) => this.sessionStore.submitRating(rating),
			onNextCard: () => this.sessionStore.nextCard(),
			onPreviousCard: () => this.sessionStore.previousCard(),
			onEndSession: () => this.handleEndSession(),
			onEditCard: () => this.handleEditCard(),
			sessionStore: this.sessionStore,
		} as const;

		// Create and mount the component
		return new Review({
			target: container,
			props,
		});
	}

	/**
	 * Called when the view is opened
	 */
	async onOpen(): Promise<void> {
		await super.onOpen();

		// Set current view in UI store
		uiStore.navigate('review');

		// Register workspace event listeners for file changes
		this.registerEvent(
			this.app.workspace.on('file-open', (file: TFile | null) => {
				// Track when a file is opened (could be our edited source)
				if (file) {
					this.editedFilePath = file.path;
				}
			}),
		);

		this.registerEvent(
			this.app.vault.on('modify', async (file: TAbstractFile) => {
				// When the edited file is modified, optionally refresh the review card
				if (file instanceof TFile && this.editedFilePath === file.path) {
					// Refresh the current card to show updated content
					await this.refreshCurrentCard();
				}
			}),
		);
	}

	/**
	 * Refreshes the current card after source file changes
	 */
	private async refreshCurrentCard(): Promise<void> {
		try {
			// Re-index the modified file to update card data
			// This would trigger a refresh in the SessionStore
			let currentCardId: string | undefined;
			this.sessionStore.subscribe((s) => {
				currentCardId = s.currentCard?.uuid;
			})();

			if (currentCardId) {
				// Trigger a re-fetch of the current card
				// The SessionStore would need a method to refresh a specific card
				console.log(`Refreshing card ${currentCardId} after source modification`);
			}
		} catch (error) {
			console.error('Failed to refresh current card:', error);
		}
	}

	/**
	 * Called when the view is closed
	 */
	async onClose(): Promise<void> {
		await super.onClose();
		this.reviewController = undefined;
	}

	/**
	 * Handles ending the review session and navigating back to dashboard
	 */
	private async handleEndSession(): Promise<void> {
		try {
			await this.sessionStore.endSession();
			uiStore.navigate('dashboard');
		} catch (error) {
			console.error('Failed to end session:', error);
			uiStore.notify({
				type: 'error',
				message: 'Failed to end session properly.',
				duration: 3000,
			});
		}
	}

	/**
	 * Handles navigating to the source file to edit the current card
	 */
	private async handleEditCard(): Promise<void> {
		// In a real implementation, we'd subscribe or use a getter
		let currentCardId: string | undefined;
		this.sessionStore.subscribe((s) => {
			currentCardId = s.currentCard?.uuid;
		})();

		if (currentCardId && this.reviewController) {
			await this.reviewController.editSource(currentCardId);
		}
	}
}
