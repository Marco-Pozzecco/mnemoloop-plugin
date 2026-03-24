<script lang="ts">
	import { Logger } from '@/utils/Logger';
	import { onMount } from 'svelte';
	import type { AppProps, AppViews } from './types';
	import { DashboardController } from '@/ui/controllers/DashboardController';
	import { Dashboard, Review } from '@/ui/components';
	import type {
		DashboardConfig,
		DashboardStats,
	} from '@/ui/components/views/Dashboard/Dashboard.types';
	import ErrorWrapper from '@/ui/components/elements/ErrorWrapper/ErrorWrapper.svelte';
	import { uiStore } from '@/ui/store/ui.store';
	import { IndexKey } from '@/types/indexes';

	const { plugin, indexes }: AppProps = $props();

	const dashboardController = $derived(new DashboardController(plugin, indexes));

	let dashboardStats: DashboardStats | null = $state(null);
	let dashboardConfig: DashboardConfig = $state({
		dailyGoal: 20,
		showProgressChart: true,
		showRetentionRate: true,
		chartTimeframe: 'week',
		preferredChartType: 'bar',
	});

	let currentView = $state(uiStore.currentView);

	uiStore.store.subscribe((state) => {
		currentView = state.currentView;
	});

	let hasError: boolean = $state(false);
	let errorMessage: string = $state('');
	let isLoadingDashboard: boolean = $state(true);

	onMount(async () => {
		if (currentView === 'dashboard') {
			await loadDashboardData();
		}
	});

	async function loadDashboardData() {
		try {
			hasError = false;
			errorMessage = '';
			dashboardStats = dashboardController.stats as DashboardStats;
			isLoadingDashboard = false;
		} catch (error) {
			Logger.error('Failed to load dashboard data:', error);
			hasError = true;
			isLoadingDashboard = false;
			errorMessage = 'Failed to load dashboard data. Please try again.';
		}
	}

	async function handleStartReview() {
		await dashboardController.startReview(IndexKey.flashcard);
		navigateTo('review');
	}

	function navigateTo(view: AppViews) {
		if (view === 'dashboard') {
			loadDashboardData();
		}
		uiStore.currentView = view;
		Logger.info(uiStore.currentView);
		Logger.info(currentView);
	}
</script>

<div class="app-container">
	{#if currentView === 'dashboard'}
		<ErrorWrapper
			fallback="Unable to load the dashboard."
			error={hasError ? new Error(errorMessage) : null}
			onRetry={loadDashboardData}
			errorContext="App"
			showError={true}
		>
			{#snippet children()}
				{#if isLoadingDashboard && !dashboardStats}
					<div class="loading-container">
						<div class="loading-spinner"></div>
						<p>Loading dashboard...</p>
					</div>
				{:else if !isLoadingDashboard && dashboardStats}
					<Dashboard
						stats={dashboardStats}
						config={dashboardConfig}
						onStartReview={handleStartReview}
						onRefresh={loadDashboardData}
					/>
				{/if}
			{/snippet}
		</ErrorWrapper>
	{:else if currentView === 'review'}
		<Review />
	{/if}
</div>

<style>
	.app-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 1rem;
		color: var(--text-muted);
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--background-modifier-border);
		border-top-color: var(--interactive-accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
