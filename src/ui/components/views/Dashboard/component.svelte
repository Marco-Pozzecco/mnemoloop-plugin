<script lang="ts">
	import { EventBus } from '@/modules/events';
	import { DashboardOpenEvent } from '@/modules/events/domains/ui/dashboard';
	import { IndexKey } from '@/types/indexes';
	import { ErrorWrapper } from '@/ui/components';
	import {
		DashboardChart,
		DashboardDeckTree,
		DashboardFooter,
		DashboardHeader,
		DashboardStatsGrid,
	} from '@/ui/components/sections';
	import { DashboardController } from '@/ui/controllers/DashboardController';
	import { deckTreeStore } from '@/ui/store/deck-tree.store';
	import { statsStore } from '@/ui/store/stats.store';
	import { uiStore } from '@/ui/store/ui.store';
	import { onMount } from 'svelte';
	import { getAppContext } from '@/ui/context/AppContext';
	import { PrimingController } from '@/ui/controllers/PrimingController';
	import { settingsStore } from '@/ui/store/settings.store';

	// Store references for automatic subscription with $ prefix
	const statsStoreRef = statsStore.store;
	const uiStoreRef = uiStore.store;
	const deckTreeRef = deckTreeStore.store;
	const settingsRef = settingsStore.settings;

	const controller = $derived(new DashboardController());
	const app = getAppContext().app;

	// state - using $derived with $ prefix for automatic store subscription
	let stats = $derived($statsStoreRef);
	let deckTree = $derived($deckTreeRef);
	let selectedDeck = $derived(deckTree.selectedDeck);
	let isLoading = $derived($uiStoreRef.isLoading);
	let isReviewDisabled = $derived(stats.flashcard.due_now === 0);
	let difficultyThreshold = $derived($settingsRef.source_note.priming.difficulty_threshold);
	let isPrimingDisabled = $derived(
		(selectedDeck ? selectedDeck.dueNow : stats.flashcard.due_now) === 0,
	);

	function onStartReview() {
		controller.startReview(IndexKey.flashcard, selectedDeck?.fullPath);
	}
	function onStartPriming() {
		const primingController = new PrimingController(app);
		void primingController.start({
			deckFilter: selectedDeck?.fullPath,
			deckLabel: selectedDeck?.name ?? 'All decks',
		});
	}

	function onSelectDeck(fullPath: string | null) {
		deckTreeStore.selectDeck(fullPath);
	}

	function onToggleExpand(fullPath: string) {
		deckTreeStore.toggleExpand(fullPath);
	}

	function onRefresh() {
		void EventBus.instance.publish(new DashboardOpenEvent());
	}

	$effect(() => {
		const interval = window.setInterval(() => {
			if (stats.flashcard.total_cards > 0) {
				return window.clearInterval(interval);
			}

			EventBus.instance.publish(new DashboardOpenEvent());
		}, 1000);

		return () => window.clearInterval(interval);
	});

	onMount(() => {
		EventBus.instance.publish(new DashboardOpenEvent());
		deckTreeStore.init();
	});
</script>

<ErrorWrapper
	fallback="Unable to load dashboard statistics"
	showError={true}
	maxRetries={3}
	errorContext="DashboardView"
>
	<div class="ml-dashboard" role="main">
		<DashboardHeader {isLoading} {onRefresh} />
		<DashboardStatsGrid {stats} />
		<DashboardDeckTree nodes={deckTree.nodes} {selectedDeck} {onSelectDeck} {onToggleExpand} />
		<DashboardChart {stats} />
		<DashboardFooter
			{stats}
			{onStartReview}
			{onStartPriming}
			isDisabled={isReviewDisabled}
			isPrimingDisabled={isPrimingDisabled}
			difficultyThreshold={difficultyThreshold}
			{isLoading}
			{selectedDeck}
		/>
	</div>
</ErrorWrapper>

<style lang="scss">
	@use 'tokens' as *;

	.ml-dashboard {
		display: flex;
		flex-direction: column;
		gap: $spacing-lg;
		padding: $spacing-lg;
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
		color: $text-normal;
		animation: ml-fade-in 0.3s ease-out;
		overflow-y: auto;
	}

	@keyframes ml-fade-in {
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
		.ml-dashboard {
			padding: $spacing-md;
			gap: $spacing-md;
		}
	}
</style>
