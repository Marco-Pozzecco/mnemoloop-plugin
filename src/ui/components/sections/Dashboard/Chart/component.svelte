<script lang="ts">
	import {
		ChartEmptyState,
		ChartReviewHeatmap,
		ChartFlashcardsForecast,
		Tabs,
	} from '@/ui/components/elements';
	import type DashboardChartProps from './types';
	import type { ChartType } from './types';

	let { stats, className }: DashboardChartProps = $props();

	let activeChart: ChartType = $state('heatmap');

	function onTabChange(chart: ChartType) {
		activeChart = chart;
	}
</script>

<section class="ml-dashboard__chart-section {className}" aria-labelledby="progress-chart-title">
	<Tabs.Root value={activeChart} onValueChange={(v) => onTabChange(v as ChartType)}>
		<Tabs.List>
			<Tabs.Trigger value="heatmap">Heatmap</Tabs.Trigger>
			<Tabs.Trigger value="forecast">Forecast</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="heatmap">
			<ChartEmptyState
				show={stats.flashcard.total_learned === 0}
				message="No review history yet. Start reviewing to see your heatmap."
			>
				<ChartReviewHeatmap {stats} year={new Date().getFullYear()} />
			</ChartEmptyState>
		</Tabs.Content>
		<Tabs.Content value="forecast">
			<ChartFlashcardsForecast />
		</Tabs.Content>
	</Tabs.Root>
</section>

<style lang="scss">
	@use 'tokens' as *;

	.ml-dashboard__chart-section {
		background-color: $background-secondary;
		border: 1px solid $background-modifier-border;
		border-radius: 12px;
		padding: $spacing-lg;
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ml-dashboard__chart-section {
			padding: $spacing-md;
		}
	}
</style>
