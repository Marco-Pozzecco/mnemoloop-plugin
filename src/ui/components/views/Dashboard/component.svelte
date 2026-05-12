<script lang="ts">
	import { EventBus } from '@/modules/events';
	import { DashboardOpenEvent } from '@/modules/events/domains/ui/dashboard';
	import { IndexKey } from '@/types/indexes';
	import { ErrorWrapper } from '@/ui/components';
	import {
		DashboardChart,
		DashboardFooter,
		DashboardHeader,
		DashboardStatsGrid,
	} from '@/ui/components/sections';
	import { DashboardController } from '@/ui/controllers/DashboardController';
	import { statsStore } from '@/ui/store/stats.store';
	import { uiStore } from '@/ui/store/ui.store';
	import { onMount } from 'svelte';
	import type { DashboardConfig } from './types';

	// Store references for automatic subscription with $ prefix
	const statsStoreRef = statsStore.store;
	const uiStoreRef = uiStore.store;

	const controller = $derived(new DashboardController());

	// state - using $derived with $ prefix for automatic store subscription
	let stats = $derived($statsStoreRef);
	let config: DashboardConfig = $state({
		chartTimeframe: 'week',
		chartType: 'heatmap',
		showProgressChart: true,
		showRetentionRate: true,
	});
	let isLoading = $derived($uiStoreRef.isLoading);
	let isReviewDisabled = $derived(stats.flashcard.due_now === 0);
	let showChart = $derived(config.showProgressChart && stats.flashcard.total_learned > 0);

	function onStartReview() {
		controller.startReview(IndexKey.flashcard);
	}

	function onRefresh() {
		//
	}

	onMount(() => {
		EventBus.instance.publish(new DashboardOpenEvent());
	});
</script>

<ErrorWrapper
	fallback="Unable to load dashboard statistics"
	showError={true}
	maxRetries={3}
	errorContext="DashboardView"
>
	<div class="ka-dashboard" role="main">
		<DashboardHeader {isLoading} {onRefresh} />
		<DashboardStatsGrid {stats} {config} />
		{#if showChart}
			<DashboardChart {stats} chartType={config.chartType} />
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
