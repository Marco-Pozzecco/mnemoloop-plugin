<script lang="ts">
	import { Button } from '@/ui/components';
	import { renderMarkdown } from '@/ui/actions/markdown';
	import type { PrimingState } from '@/ui/store/priming.store';

	interface Props {
		state: PrimingState;
		onPrevious: () => void;
		onNextOrBeginReview: () => void;
	}

	let { state, onPrevious, onNextOrBeginReview }: Props = $props();

	let isLastNote = $derived(state.currentIndex === state.notes.length - 1);
</script>

{#if state.status === 'ready' && state.currentContent}
	<article class="ml-priming__reader">
		<header class="ml-priming__reader-header">
			<h2 class="ml-priming__reader-title">{state.currentContent.title}</h2>
		</header>

		<div class="ml-priming__reader-divider"></div>

		<div
			class="ml-priming__reader-content"
			use:renderMarkdown={{
				content: state.currentContent.content,
				sourcePath: state.currentContent.path,
			}}
		></div>
	</article>

	<div class="ml-priming__reader-controls">
		<Button
			variant="secondary"
			size="medium"
			class="ml-priming__control"
			disabled={state.currentIndex === 0}
			onclick={onPrevious}
		>
			Previous note
		</Button>

		<span class="ml-priming__reader-controls-spacer"></span>

		{#if isLastNote}
			<Button
				variant="primary"
				size="medium"
				class="ml-priming__control"
				onclick={onNextOrBeginReview}
			>
				Begin review
			</Button>
		{:else}
			<Button
				variant="primary"
				size="medium"
				class="ml-priming__control"
				onclick={onNextOrBeginReview}
			>
				Next note
			</Button>
		{/if}
	</div>
{/if}

<style lang="scss">
	@use 'tokens' as *;

	.ml-priming__reader {
		display: flex;
		flex-direction: column;
		min-width: 0;
		height: 100%;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-sm;
		background-color: $background-primary;
	}

	.ml-priming__reader-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: $spacing-sm;
		padding: $spacing-md;
	}

	.ml-priming__reader-title {
		margin: 0;
		color: $text-normal;
		font-size: $heading-md;
		font-weight: $font-bold;
		line-height: 1.45;
	}

	.ml-priming__reader-divider {
		height: 1px;
		background-color: $background-modifier-border;
		margin: 0 $spacing-md;
	}

	.ml-priming__reader-content {
		flex: 1;
		min-height: 0;
		padding: $spacing-md;
		overflow-y: auto;
		color: $text-normal;
		font-size: $font-md;
		line-height: 1.6;
	}

	.ml-priming__reader-controls {
		grid-column: 2 / 2;
		width: 100%;
		display: flex;
		align-items: center;
		gap: $spacing-sm;
	}

	.ml-priming__reader-controls-spacer {
		flex: 1;
	}

	@media (max-width: 480px) {
		.ml-priming__reader-controls {
			flex-direction: column;
			align-items: stretch;
			gap: $spacing-sm;
		}

		.ml-priming__reader-controls-spacer {
			display: none;
		}

		:global(.ml-priming__reader-controls .ml-button) {
			width: 100%;
		}
	}
</style>
