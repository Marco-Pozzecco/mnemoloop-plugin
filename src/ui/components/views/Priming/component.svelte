<script lang="ts">
	import { getAppContext } from '@/ui/context/AppContext';
	import { PrimingController } from '@/ui/controllers/PrimingController';
	import { primingStore } from '@/ui/store/priming.store';
	import PrimingHeader from './Header/component.svelte';
	import PrimingOutline from './Outline/component.svelte';
	import PrimingProgress from './Progress/component.svelte';
	import PrimingReader from './Reader/component.svelte';
	import PrimingStateView from './StateView/component.svelte';

	const storeRef = primingStore.store;
	let state = $derived($storeRef);

	const app = getAppContext().app;
	let controller: PrimingController | null = null;

	function getController(): PrimingController {
		if (!controller) {
			controller = new PrimingController(app);
		}
		return controller;
	}

	function onExit() {
		getController().exit();
	}

	function onSelect(index: number) {
		void getController().select(index);
	}

	function onPrevious() {
		void getController().previous();
	}

	function onNextOrBeginReview() {
		void getController().nextOrBeginReview();
	}

	function onRetry() {
		void getController().retry();
	}

	function onBeginReview() {
		void getController().nextOrBeginReview();
	}
</script>

<div class="ml-priming" role="main">
	<PrimingHeader {state} {onExit} />

	{#if state.status === 'ready'}
		<PrimingProgress {state} />
		<div class="ml-priming__content">
			<PrimingOutline primingState={state} {onSelect} />
			<PrimingReader {state} {onPrevious} {onNextOrBeginReview} />
		</div>
	{:else}
		<PrimingStateView {state} {onBeginReview} {onRetry} onDashboard={onExit} />
	{/if}
</div>

<style lang="scss">
	@use 'tokens' as *;
	@use 'breakpoints' as *;

	.ml-priming {
		display: flex;
		flex-direction: column;
		gap: $spacing-lg;
		padding: $spacing-lg;
		width: 100%;
		max-width: 960px;
		margin: 0 auto;
		color: $text-normal;
		animation: ml-fade-in 0.3s ease-out;
	}

	.ml-priming__content {
		display: grid;
		grid-template-columns: 240px minmax(0, 1fr);
		gap: $spacing-lg;
		align-items: start;
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

	@media (max-width: $tablet-breakpoint) {
		.ml-priming {
			padding: $spacing-md;
			gap: $spacing-md;
		}

		.ml-priming__content {
			display: flex;
			flex-direction: column;
			gap: $spacing-md;
			width: 100%;
		}
	}
</style>
