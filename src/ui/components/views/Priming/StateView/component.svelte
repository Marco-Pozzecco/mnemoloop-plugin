<script lang="ts">
	import Button from '@/ui/components/elements/Button/component.svelte';
	import Props from './types';

	let { state, onBeginReview, onRetry, onDashboard }: Props = $props();
</script>

{#if state.status === 'loading'}
	<div class="ml-priming__state" aria-live="polite">
		<h2 class="ml-priming__state-heading">Finding difficult notes</h2>
		<div class="ml-priming__loading-shell" aria-hidden="true">
			<div class="ml-priming__loading-outline">
				<span class="ml-priming__skeleton ml-priming__skeleton--line"></span>
				<span class="ml-priming__skeleton ml-priming__skeleton--line"></span>
				<span class="ml-priming__skeleton ml-priming__skeleton--line"></span>
			</div>
			<div class="ml-priming__loading-reader">
				<span class="ml-priming__skeleton ml-priming__skeleton--title"></span>
				<span class="ml-priming__skeleton ml-priming__skeleton--line"></span>
				<span class="ml-priming__skeleton ml-priming__skeleton--line"></span>
				<span class="ml-priming__skeleton ml-priming__skeleton--line"></span>
			</div>
		</div>
	</div>
{:else if state.status === 'empty'}
	<div class="ml-priming__state">
		<h2 class="ml-priming__state-heading">No difficult notes to prime</h2>
		<p class="ml-priming__state-copy">
			{`No eligible Markdown source notes in ${state.selection.deckLabel} are linked to active cards due now above difficulty ${state.threshold.toFixed(1)}.`}
		</p>
		<div class="ml-priming__state-controls">
			<Button variant="secondary" size="medium" onclick={onDashboard}>Back to dashboard</Button>
			<Button variant="primary" size="medium" onclick={onBeginReview}>Begin review</Button>
		</div>
	</div>
{:else if state.status === 'unavailable'}
	<div class="ml-priming__state">
		<h2 class="ml-priming__state-heading">Couldn’t prepare your note map</h2>
		<p class="ml-priming__state-copy">Check your vault links and try again.</p>
		<div class="ml-priming__state-controls">
			<Button variant="secondary" size="medium" onclick={onBeginReview}>Begin review</Button>
			<Button variant="primary" size="medium" onclick={onRetry}>Try again</Button>
		</div>
	</div>
{/if}

<style lang="scss">
	@use 'tokens' as *;

	.ml-priming__state {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: $spacing-sm;
	}

	.ml-priming__state-heading {
		margin: 0;
		color: $text-normal;
		font-size: $heading-md;
		font-weight: $font-bold;
	}

	.ml-priming__state-copy {
		margin: 0;
		color: $text-muted;
		font-size: $font-sm;
	}

	.ml-priming__state-controls {
		display: flex;
		gap: $spacing-sm;
		margin-top: $spacing-xs;
	}

	.ml-priming__loading-shell {
		display: flex;
		gap: $spacing-lg;
		width: 100%;
		padding: $spacing-md;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-sm;
		background-color: $background-primary;
	}

	.ml-priming__loading-outline {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		width: 240px;
		flex-shrink: 0;
	}

	.ml-priming__loading-reader {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
		flex: 1;
	}

	.ml-priming__skeleton {
		display: block;
		height: 12px;
		border-radius: $radius-xs;
		background-color: $background-modifier-border;
		animation: ml-priming-pulse 1.4s ease-in-out infinite;

		&--title {
			height: 20px;
			width: 60%;
		}

		&--line {
			width: 100%;
		}
	}

	@keyframes ml-priming-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	@media (max-width: 480px) {
		.ml-priming__state-controls {
			flex-direction: column;
			align-items: stretch;
			width: 100%;
		}

		:global(.ml-priming__state-controls .ml-button) {
			width: 100%;
		}

		.ml-priming__loading-outline {
			display: none;
		}
	}
</style>
