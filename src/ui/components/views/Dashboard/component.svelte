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

	// props
	const { controller }: DashboardProps = $props();

	// state
	let stats: Stats = $state(statsStore.stats);
	let config: DashboardConfig = $state({
		chartTimeframe: 'week',
		chartType: 'bar',
		showProgressChart: true,
		showRetentionRate: true,
	});
	let isLoading = $state(uiStore.isLoading);
	let session = $state(sessionStore.state);
	let isReviewDisabled = $derived(session.queue?.size === 0 || isLoading);
	let showChart = $derived(config.showProgressChart && stats.total_learned > 0);

	// subscribtions
	statsStore.store.subscribe((state) => {
		stats = state;
	});

	uiStore.store.subscribe((state) => {
		isLoading = state.isLoading;
	});

	sessionStore.store.subscribe((state) => {
		session = state;
	});

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
