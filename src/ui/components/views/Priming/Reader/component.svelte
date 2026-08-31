<script lang="ts">
	import Button from '@/ui/components/elements/Button/component.svelte';
	import { renderMarkdown } from '@/ui/actions/markdown';
	import type { PrimingState } from '@/ui/store/priming.store';
	import { Icon } from '@/ui/components/elements';

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
		<div class="ml-priming__reader-controls">
			<Button
				variant="link"
				size="medium"
				class="ml-priming__control"
				disabled={state.currentIndex === 0}
				onclick={onPrevious}
			>
				<Icon name="arrow-left" size={16} />
				Previous note
			</Button>

			{#if isLastNote}
				<Button
					variant="link"
					size="medium"
					class="ml-priming__control ml-priming__control-review"
					onclick={onNextOrBeginReview}
				>
					<Icon name="play" size={16} />
					Begin review
				</Button>
			{:else}
				<Button
					variant="link"
					size="medium"
					class="ml-priming__control"
					onclick={onNextOrBeginReview}
				>
					Next note
					<Icon name="arrow-right" size={16} />
				</Button>
			{/if}
		</div>
	</article>
{/if}

<style lang="scss">
	@use 'tokens' as *;

	.ml-priming__reader {
		position: sticky;
		top: 0;
		display: flex;
		flex-direction: column;
		min-width: 0;
		height: fit-content;
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
		border-top: 1px solid $background-modifier-border;
		padding: $spacing-md;
		width: 100%;
		display: flex;
		align-items: center;
		gap: $spacing-sm;

		:global .ml-priming__control {
			width: 100%;
			border-radius: 0;
			gap: $spacing-xs;

			&:hover:not(:disabled) {
				background-color: $background-modifier-hover;
				color: $font-normal;
				transition: background-color $transition-fast;
			}

			&-review {
				&:hover:not(:disabled) {
					background-color: $background-modifier-selected;
					color: $text-accent;
					transition: background-color $transition-fast;
				}
			}
		}
	}

	@media (max-width: 480px) {
		:global(.ml-priming__reader-controls .ml-button) {
			width: 100%;
		}
	}
</style>
