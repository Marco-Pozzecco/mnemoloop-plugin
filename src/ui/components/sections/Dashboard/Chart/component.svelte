<script lang="ts">
	import { ChartHeatmap } from '@/ui/components/elements';
	import type DashboardChartProps from './types';

	let { stats, chartType, className }: DashboardChartProps = $props();
</script>

<section class="ml-dashboard__chart-section {className}" aria-labelledby="progress-chart-title">
	{#if chartType === 'heatmap'}
		<ChartHeatmap {stats} year={new Date().getFullYear()} />
	{/if}
</section>

<style>
	.ml-dashboard__chart-section {
		background-color: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 12px;
		padding: 24px;
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ml-dashboard__chart-section {
			padding: 16px;
		}
	}
</style>
