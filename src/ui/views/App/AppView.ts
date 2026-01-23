import type { App } from 'obsidian';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import type { NavigationManager } from './NavigationManager';
import type { IndexManager } from '@/core/indexer/IndexerManager';
import type { StatisticsManager } from '@/core/statistics';
import type { SessionStore } from '@/ui/stores/session/SessionStore';
import type { DueQueueManager } from '@/core/srs';
import { SvelteComponent } from 'svelte';
import { default as Home } from './App.svelte';
import { ApplicationStore } from '@/ui/stores/ApplicationStore';
import { EventBus } from '@/ui/infrastructure/EventBus';
import { DependencyContainer } from '@/ui/infrastructure/DependencyContainer';
import { setManagersContext } from '@/ui/infrastructure/ManagersContext';
import { Logger } from '@/utils/Logger';
import { DashboardController } from '@/ui/controllers/DashboardController';
import { ReviewController } from '@/ui/controllers/ReviewController';

/**
 * View type for the unified home view
 */
export const APP_VIEW = 'knowledge-accelerator-home';

/**
 * Home view class for the unified plugin interface
 * Extends Obsidian's ItemView to integrate with the workspace
 */
export class AppView extends ItemView {
	private navigationManager: NavigationManager;
	private indexManager: IndexManager;
	private statisticsManager: StatisticsManager;
	private dueQueueManager: DueQueueManager;
	private homeComponent: Home | null = null;
	private applicationStore: ApplicationStore | null = null;
	private eventBus: EventBus;
	private dependencyContainer: DependencyContainer;
	protected viewType: string = APP_VIEW;

	constructor(
		leaf: WorkspaceLeaf,
		app: App,
		navigationManager: NavigationManager,
		indexManager: IndexManager,
		statisticsManager: StatisticsManager,
		dueQueueManager: DueQueueManager,
	) {
		super(leaf);
		this.navigationManager = navigationManager;
		this.indexManager = indexManager;
		this.statisticsManager = statisticsManager;
		this.dueQueueManager = dueQueueManager;

		// Initialize EventBus and DependencyContainer
		this.eventBus = new EventBus();
		this.dependencyContainer = new DependencyContainer();
	}

	/**
	 * Returns the view type identifier
	 */
	getViewType(): string {
		return APP_VIEW;
	}

	/**
	 * Returns the display name for the view
	 */
	getDisplayText(): string {
		return 'Knowledge Accelerator';
	}

	/**
	 * Returns the icon for the view
	 */
	getIcon(): string {
		return 'brain';
	}

	/**
	 * Called when the view is opened in the workspace
	 */
	async onOpen(): Promise<void> {
		try {
			Logger.info('Opening Knowledge Accelerator view');

			// Store the leaf reference in NavigationManager
			this.navigationManager.initializeWithLeaf(this.leaf);

			// Set up dependency container
			this.setupDependencyContainer();

			// Initialize ApplicationStore
			await this.initializeApplicationStore();

			// Load the Svelte component
			const homeComponent = new Home({
				target: this.contentEl,
				props: {
					app: this.app,
					navigationManager: this.navigationManager,
					indexManager: this.indexManager,
					statisticsManager: this.statisticsManager,
					sessionStore: this.applicationStore?.session,
					dueQueueManager: this.dueQueueManager,
					applicationStore: this.applicationStore,
					dependencyContainer: this.dependencyContainer,
				},
			});

			// Store component reference for cleanup
			this.homeComponent = homeComponent;

			Logger.info('Knowledge Accelerator view opened successfully');
		} catch (error) {
			Logger.error('Failed to open Home view:', error);
			this.containerEl.createEl('div', { text: 'Failed to load Knowledge Accelerator' });
		}
	}

/**
 * Sets up dependency container with registered services
 */
private setupDependencyContainer(): void {
	// Register managers as singletons
	this.dependencyContainer.registerSingleton(
		'EventBus',
		() => this.eventBus
	);
	this.dependencyContainer.registerSingleton(
		'IndexManager',
		() => this.indexManager
	);
	this.dependencyContainer.registerSingleton(
		'StatisticsManager',
		() => this.statisticsManager
	);
	this.dependencyContainer.registerSingleton(
		'DueQueueManager',
		() => this.dueQueueManager
	);
	this.dependencyContainer.registerSingleton(
		'NavigationManager',
		() => this.navigationManager
	);

	// Register ApplicationStore (will be created in initializeApplicationStore)
	this.dependencyContainer.registerSingleton(
		'ApplicationStore',
		() => this.applicationStore!
	);

	// Register controllers as transient services
	this.dependencyContainer.register('DashboardController', () => {
		return new DashboardController(
			this.dependencyContainer.resolve('Logger'),
			this.dependencyContainer.resolve('EventBus'),
			this.indexManager,
			this.statisticsManager
		);
	});

	this.dependencyContainer.register('ReviewController', () => {
		return new ReviewController(
			this.dependencyContainer.resolve('Logger'),
			this.dependencyContainer.resolve('EventBus'),
			this.app,
			this.indexManager,
			this.applicationStore?.session!
		);
	});

	Logger.debug('Dependency container set up with services');
}

	/**
	 * Initializes the ApplicationStore and sets up ManagersContext
	 */
	private async initializeApplicationStore(): Promise<void> {
		try {
			// Create ApplicationStore
			this.applicationStore = new ApplicationStore({
				eventBus: this.eventBus,
				indexManager: this.indexManager,
				statsManager: this.statisticsManager,
				dueQueueManager: this.dueQueueManager,
			});

			// Initialize ApplicationStore
			await this.applicationStore.initialize();

			Logger.info('ApplicationStore initialized');

			// Set up ManagersContext for Svelte component tree
			setManagersContext(this.dependencyContainer);

			Logger.debug('ManagersContext set up');
		} catch (error) {
			Logger.error('Failed to initialize ApplicationStore:', error);
			throw error;
		}
	}

	/**
	 * Called when the view is closed
	 */
	async onClose(): Promise<void> {
		try {
			Logger.info('Closing Knowledge Accelerator view');

			// Clean up ApplicationStore
			if (this.applicationStore) {
				await this.applicationStore.dispose();
				this.applicationStore = null;
				Logger.debug('ApplicationStore disposed');
			}

			// Clean up dependency container
			this.dependencyContainer.clear();

			// Clean up EventBus
			this.eventBus.clear();

			// Clean up Svelte component
			if (this.homeComponent) {
				this.homeComponent.$destroy();
				this.homeComponent = null;
			}

			// Close unified view
			this.navigationManager.closeUnifiedView();

			Logger.info('Knowledge Accelerator view closed successfully');
		} catch (error) {
			Logger.error('Failed to close Home view:', error);
		}
	}
}
