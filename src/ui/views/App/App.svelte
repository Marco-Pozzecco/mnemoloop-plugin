<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { setManagersContext } from '@/ui/infrastructure/ManagersContext';
  import type { DependencyContainer } from '@/ui/infrastructure/DependencyContainer';
  import { Logger } from '@/utils/Logger';
  import type { NavigationManager } from './NavigationManager';
  import type { IndexManager } from '@/core/indexer/IndexerManager';
  import type { StatisticsManager } from '@/core/statistics';
  import type { DueQueueManager } from '@/core/srs';
  import type { ApplicationStore } from '@/ui/stores/ApplicationStore';
  import type { DashboardStats, DashboardConfig } from '../Dashboard/types';
  import { DashboardController } from '@/ui/controllers/DashboardController';
  import Dashboard from '../Dashboard/Dashboard.svelte';
  import Review from '../Review/Review.svelte';
	import { ReviewController } from '@/ui/controllers/ReviewController';

  export let app: any;
  export let navigationManager: NavigationManager;
  export let indexManager: IndexManager;
  export let statisticsManager: StatisticsManager;
  export let dueQueueManager: DueQueueManager;
  export let applicationStore: ApplicationStore;
  export let dependencyContainer: DependencyContainer;

  let dashboardStats: DashboardStats | null = null;
  let dashboardConfig: DashboardConfig = {
    dailyGoal: 20,
    showProgressChart: true,
    showRetentionRate: true,
    chartTimeframe: 'week',
    preferredChartType: 'bar'
  };

  let dashboardController: DashboardController;
  let reviewController: ReviewController;
  let hasError = false;
  let errorMessage = '';

  // Set ManagersContext for Svelte component tree
  // This makes the dependency container available to all child components
  setManagersContext(dependencyContainer);

  // Subscribe to UI store for view changes
  $: currentView = applicationStore?.ui.state.currentView;

  onMount(async () => {
    const sessionStore = applicationStore.session;

    // Resolve controllers from dependency container via context
    // This demonstrates T097-T099: using context instead of passing managers
    dashboardController = dependencyContainer.resolve<DashboardController>('DashboardController');
    reviewController = dependencyContainer.resolve<ReviewController>('ReviewController');

    // Load initial dashboard data
    if (currentView === 'dashboard') {
      await loadDashboardData();
    }
  });

  async function loadDashboardData() {
    try {
      dashboardStats = await dashboardController.getStats();
      hasError = false;
    } catch (error) {
      Logger.error('Failed to load dashboard data:', error);
      hasError = true;
      errorMessage = 'Failed to load dashboard data. Please try again.';
    }
  }

  async function handleStartReview() {
    await applicationStore.session.startSession();
    navigationManager.navigateTo('review');
  }

  function navigateTo(view: 'dashboard' | 'review' | 'settings') {
    applicationStore.ui.navigate(view);
    if (view === 'dashboard') {
      loadDashboardData();
    }
  }
</script>

<div class="app-container">
    {#if hasError}
      <div class="error-boundary" role="alert">
        <div class="error-content">
          <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2 class="error-title">Something went wrong</h2>
          <p class="error-message">{errorMessage}</p>
          <button class="retry-button" on:click={loadDashboardData} aria-label="Retry">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="retry-icon">
              <path d="M23 4v6h-6"></path>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Retry
          </button>
        </div>
      </div>
    {:else if currentView === 'dashboard' && dashboardStats}
      <Dashboard
        stats={dashboardStats}
        config={dashboardConfig}
        onStartReview={handleStartReview}
        onRefresh={loadDashboardData}
      />
    {:else if currentView === 'review'}
      <Review
        app={app}
        sessionStore={applicationStore.session}
        navigationManager={navigationManager}
      />
    {/if}
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .error-boundary {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 2rem;
    background-color: var(--background-secondary);
    border-radius: 12px;
    border: 1px solid var(--text-error);
  }

  .error-content {
    text-align: center;
    max-width: 400px;
  }

  .error-icon {
    width: 64px;
    height: 64px;
    color: var(--text-error);
    margin-bottom: 1rem;
  }

  .error-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: var(--font-bold);
    color: var(--text-error);
  }

  .error-message {
    margin: 0 0 1.5rem 0;
    color: var(--text-muted);
    font-size: var(--font-ui-small);
  }

  .retry-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: 6px;
    font-size: var(--font-ui-medium);
    font-weight: var(--font-semibold);
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .retry-button:hover {
    background-color: var(--interactive-accent-hover);
  }

  .retry-button:active {
    transform: translateY(1px);
  }

  .retry-icon {
    width: 16px;
    height: 16px;
  }
</style>
