import type { EventBus } from '@/ui/infrastructure/EventBus';
import { AppEvents } from '@/ui/infrastructure/EventBus';
import { Logger } from '@/utils/Logger';
import { SessionStore } from './session/SessionStore';
import { SettingsStore } from './settings/SettingsStore';
import { UIStore } from './ui/UIStore';

/**
 * Dependencies required by ApplicationStore
 */
export interface AppStoreDependencies {
	eventBus: EventBus;
	indexManager: any;
	statsManager: any;
	dueQueueManager: any;
}

/**
 * Application Store that composes all feature-specific stores.
 *
 * This is the central state management hub that:
 * - Composes SessionStore, SettingsStore, and UIStore
 * - Sets up cross-store event listeners
 * - Provides lifecycle management (initialize/dispose)
 * - Unifies access to all stores
 *
 * @see FR-002: System MUST provide centralized application store
 * @see data-model.md section: Entity: ApplicationStore
 */
export class ApplicationStore {
	public readonly session: SessionStore;
	public readonly settings: SettingsStore;
	public readonly ui: UIStore;
	private readonly eventBus: EventBus;
	private unsubscribeFunctions: Array<() => void> = [];
	private isInitialized = false;

	constructor(dependencies: AppStoreDependencies) {
		this.eventBus = dependencies.eventBus;

		// Initialize stores
		this.session = new SessionStore({
			eventBus: this.eventBus,
			indexManager: dependencies.indexManager,
			statsManager: dependencies.statsManager,
			dueQueueManager: dependencies.dueQueueManager,
		});

		this.settings = new SettingsStore({
			eventBus: this.eventBus,
		});

		this.ui = new UIStore({
			eventBus: this.eventBus,
		});

		Logger.debug('ApplicationStore created');
	}

	/**
	 * Initializes the application store and sets up cross-store listeners
	 */
	async initialize(): Promise<void> {
		if (this.isInitialized) {
			Logger.warn('ApplicationStore already initialized');
			return;
		}

		Logger.info('Initializing ApplicationStore');

		try {
			// Set up cross-store event listeners
			this.setupCrossStoreListeners();

			// TODO: Load persisted settings from plugin data
			// TODO: Load persisted UI state from plugin data

			this.isInitialized = true;
			Logger.info('ApplicationStore initialized successfully');
		} catch (error) {
			Logger.error('Failed to initialize ApplicationStore:', error);
			throw error;
		}
	}

	/**
	 * Sets up cross-store event listeners for inter-store communication
	 */
	private setupCrossStoreListeners(): void {
		// Settings: theme change → UI: update theme
		const unsubscribeThemeChange = this.eventBus.on(
			AppEvents.SETTINGS_UPDATED,
			(data: unknown) => {
				const payload = data as { key: string; value: unknown };
				if (payload.key === 'theme') {
					// Sync UI theme with settings theme
					const themeValue = payload.value as 'light' | 'dark' | 'system';
					if (themeValue !== 'system') {
						this.ui.setTheme(themeValue);
					}
				}
			}
		);
		this.unsubscribeFunctions.push(unsubscribeThemeChange);

		// Session: completed → Trigger statistics update
		const unsubscribeSessionCompleted = this.eventBus.on(
			AppEvents.SESSION_COMPLETED,
			(data: unknown) => {
				Logger.info(`Session completed: ${JSON.stringify(data)}`);
				// TODO: Trigger statistics update
				// This will be implemented when StatisticsManager is integrated
			}
		);
		this.unsubscribeFunctions.push(unsubscribeSessionCompleted);

		// Session: started → Update UI state (if needed)
		const unsubscribeSessionStarted = this.eventBus.on(
			AppEvents.SESSION_STARTED,
			(data: unknown) => {
				Logger.info(`Session started: ${JSON.stringify(data)}`);
				// Navigate to review view if not already there
				if (this.ui.state.currentView !== 'review') {
					this.ui.navigate('review');
				}
			}
		);
		this.unsubscribeFunctions.push(unsubscribeSessionStarted);

		// Card: rated → Queue update
		const unsubscribeCardRated = this.eventBus.on(
			AppEvents.CARD_RATED,
			(data: unknown) => {
				Logger.debug(`Card rated: ${JSON.stringify(data)}`);
				// TODO: Update queue state
			}
		);
		this.unsubscribeFunctions.push(unsubscribeCardRated);

		Logger.debug(
			`Set up ${this.unsubscribeFunctions.length} cross-store event listeners`
		);
	}

	/**
	 * Disposes the application store and cleans up resources
	 */
	async dispose(): Promise<void> {
		if (!this.isInitialized) {
			Logger.warn('ApplicationStore not initialized, nothing to dispose');
			return;
		}

		Logger.info('Disposing ApplicationStore');

		try {
			// Clean up event listeners
			for (const unsubscribe of this.unsubscribeFunctions) {
				unsubscribe();
			}
			this.unsubscribeFunctions = [];

			// Reset stores
			this.session.reset();
			this.settings.reset();
			this.ui.reset();

			this.isInitialized = false;
			Logger.info('ApplicationStore disposed successfully');
		} catch (error) {
			Logger.error('Failed to dispose ApplicationStore:', error);
			throw error;
		}
	}

	/**
	 * Gets the initialization status
	 */
	get initialized(): boolean {
		return this.isInitialized;
	}
}
