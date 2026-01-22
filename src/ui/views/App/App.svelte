<script lang="ts">
  import { onMount } from 'svelte';
  import { navigationState } from './NavigationManager';
  import type { NavigationManager } from './NavigationManager';
  import type { IndexManager } from '@/core/indexer/IndexerManager';
  import type { StatisticsManager } from '@/core/statistics';
  import type { SessionStore } from '@/ui/stores/SessionStore';
  import type { DueQueueManager } from '@/core/srs';
  import type { DashboardStats, DashboardConfig } from '../Dashboard/types';
  import { DashboardController } from '../Dashboard/DashboardController';
  import { ReviewController } from '../Review/ReviewController';
  import Dashboard from '../Dashboard/Dashboard.svelte';
  import Review from '../Review/Review.svelte';

  export let app: any;
  export let navigationManager: NavigationManager;
  export let indexManager: IndexManager;
  export let statisticsManager: StatisticsManager;
  export let sessionStore: SessionStore;
  export let dueQueueManager: DueQueueManager;

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

  onMount(async () => {
    dashboardController = new DashboardController(
      indexManager,
      statisticsManager,
      dueQueueManager,
      sessionStore
    );
    reviewController = new ReviewController(app, indexManager, sessionStore);

    // Load initial dashboard data
    if ($navigationState.currentView === 'dashboard') {
      await loadDashboardData();
    }
  });

  async function loadDashboardData() {
    try {
      dashboardStats = await dashboardController.getStats();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }

  async function handleStartReview() {
    await sessionStore.startSession();
    navigationManager.navigateTo('review');
  }

  function navigateTo(view: 'dashboard' | 'review') {
    if ($navigationState.currentView !== view) {
      navigationManager.navigateTo(view);
      if (view === 'dashboard') {
        loadDashboardData();
      }
    }
  }
</script>

<div class="app-container">
    {#if $navigationState.currentView === 'dashboard' && dashboardStats}
      <Dashboard
        stats={dashboardStats}
        config={dashboardConfig}
        onStartReview={handleStartReview}
        onRefresh={loadDashboardData}
      />
    {:else if $navigationState.currentView === 'review'}
      <Review
        app={app}
        sessionStore={sessionStore}
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
</style>
