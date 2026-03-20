<script lang="ts">
	import { ErrorWrapper } from '@/ui/components';
	import {
		DashboardChart,
		DashboardFooter,
		DashboardHeader,
		DashboardProgress,
		DashboardStatsGrid,
	} from '@/ui/components/sections';
	import { uiStore } from '@/ui/store/ui.store';
	import type { DashboardProps } from './Dashboard.types';

	let {
		stats,
		config,
		onStartReview = () => {},
		onRefresh = () => {},
		onOpenSettings = () => {},
		onConfigChange = () => {},
	}: DashboardProps = $props();

	let isLoading = $state(uiStore.isLoading);

	uiStore.store.subscribe((state) => {
		isLoading = state.isLoading;
	});

	let isReviewDisabled = $derived(stats.dueCount === 0 || isLoading);
	let showChart = $derived(config.showProgressChart && stats.progressData.length > 0);
</script>

<ErrorWrapper
	fallback="Unable to load dashboard statistics"
	onRetry={onRefresh}
	showError={true}
	maxRetries={3}
	errorContext="DashboardView"
>
	<div class="ka-dashboard" role="main" aria-label="Learning Dashboard">
		<DashboardHeader {isLoading} {onRefresh} />
		<DashboardStatsGrid {stats} {config} />
		<DashboardProgress {stats} />
		{#if showChart}
			<DashboardChart {stats} />
		{/if}
		<DashboardFooter {stats} {onStartReview} isDisabled={isReviewDisabled} {isLoading} />
	</div>
</ErrorWrapper>

<style>
	.ka-dashboard {
		display: flex;
		flex-direction: column;
		gap: 24px;
		padding: 24px;
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
		color: var(--text-normal);
		animation: ka-fade-in 0.3s ease-out;
	}

	@keyframes ka-fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ka-dashboard {
			padding: 16px;
			gap: 16px;
		}
	}
</style>
