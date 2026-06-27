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

<style>
	.ml-analytics {
		display: flex;
		flex-direction: column;
		gap: 24px;
		padding: 24px;
		overflow-y: auto;
		height: 100%;
	}

	.ml-analytics__section {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.ml-analytics__section-title {
		font-size: var(--font-ui-medium);
		font-weight: var(--font-semibold);
		margin: 0;
		color: var(--text-normal);
	}

	.ml-analytics__filter-note {
		font-size: var(--font-ui-small);
		color: var(--text-muted);
		margin: 0;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.ml-analytics__clear-filter {
		background: none;
		border: none;
		color: var(--interactive-accent);
		cursor: pointer;
		font-size: var(--font-ui-small);
		padding: 0;
		text-decoration: underline;
	}

	.ml-analytics__clear-filter:hover {
		color: var(--text-accent-hover);
	}

	.ml-analytics__charts-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
	}

	@media (max-width: 768px) {
		.ml-analytics {
			padding: 16px;
		}

		.ml-analytics__charts-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
