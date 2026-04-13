<script lang="ts">
	import type { Stats } from '@/schemas';
	import { IndexKey } from '@/types/indexes';
	import { ErrorWrapper } from '@/ui/components';
	import {
		DashboardChart,
		DashboardFooter,
		DashboardHeader,
		DashboardProgress,
		DashboardStatsGrid,
	} from '@/ui/components/sections';
	import { sessionStore } from '@/ui/store/session.store';
	import { statsStore } from '@/ui/store/stats.store';
	import { uiStore } from '@/ui/store/ui.store';
	import type DashboardProps from './types';
	import type { DashboardConfig } from './types';

	// Store references for automatic subscription with $ prefix
	const statsStoreRef = statsStore.store;
	const uiStoreRef = uiStore.store;
	const sessionStoreRef = sessionStore.store;

	// props
	const { controller }: DashboardProps = $props();

	// state - using $derived with $ prefix for automatic store subscription
	let stats = $derived($statsStoreRef);
	let config: DashboardConfig = $state({
		chartTimeframe: 'week',
		chartType: 'bar',
		showProgressChart: true,
		showRetentionRate: true,
	});
	let isLoading = $derived($uiStoreRef.isLoading);
	let session = $derived($sessionStoreRef);
	let isReviewDisabled = $derived(session.queue?.size === 0 || isLoading);
	let showChart = $derived(config.showProgressChart && stats.flashcard.total_learned > 0);

	function onStartReview() {
		controller.startReview(IndexKey.flashcard);
	}

	function onRefresh() {
		//
	}
</script>

<ErrorWrapper
	fallback="Unable to load dashboard statistics"
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
