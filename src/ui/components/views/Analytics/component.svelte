<script lang="ts">
	import {
		ChartFlashcardsCumulative,
		ChartFlashcardsRetentionRate,
	} from '@/ui/components/elements';
	import { AnalyticsReview } from '@/ui/components/sections';
	import { AnalyticsController } from '@/ui/controllers/AnalyticsController';
	import { analyticsStore } from '@/ui/store/analytics.store';
	import { settingsStore } from '@/ui/store/settings.store';
	import { onDestroy, onMount } from 'svelte';
	import type AnalyticsProps from './types';

	let { className }: AnalyticsProps = $props();

	const controller = $derived(new AnalyticsController());
	const storeRef = analyticsStore.store;
	const storeState = $derived($storeRef);

	const flashcards = $derived(storeState.flashcards);
	const settingsRef = settingsStore.store;
	const requestRetention = $derived($settingsRef.flashcard.fsrs.request_retention);
	const stats = $derived(storeState.stats);

	onMount(async () => {
		await controller.init();
	});

	onDestroy(() => {
		controller.dispose();
	});
</script>

<div class="ml-analytics {className ?? ''}">
	<AnalyticsReview />

	<section class="ml-analytics__charts-grid">
		<ChartFlashcardsCumulative {flashcards} />
		<ChartFlashcardsRetentionRate {stats} {requestRetention} />
	</section>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-analytics {
		display: flex;
		flex-direction: column;
		gap: $spacing-lg;
		padding: $spacing-lg;
		overflow-y: auto;
		height: 100%;
	}

	.ml-analytics__section {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
	}

	.ml-analytics__section-title {
		font-size: $font-md;
		font-weight: $font-semibold;
		margin: 0;
		color: $text-normal;
	}

	.ml-analytics__filter-note {
		font-size: $font-sm;
		color: $text-muted;
		margin: 0;
		display: flex;
		align-items: center;
		gap: $spacing-xs;
	}

	.ml-analytics__clear-filter {
		background: none;
		border: none;
		color: $interactive-accent;
		cursor: pointer;
		font-size: $font-sm;
		padding: 0;
		text-decoration: underline;
	}

	.ml-analytics__clear-filter:hover {
		color: $text-accent-hover;
	}

	.ml-analytics__charts-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: $spacing-md;
	}

	@media (max-width: 768px) {
		.ml-analytics {
			padding: $spacing-md;
		}

		.ml-analytics__charts-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
