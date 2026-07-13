<script lang="ts">
	import { Button, Icon } from '@/ui/components';
	import { tokens } from '@/utils/token';
	import type { RatingButton } from '../types';
	import type ManualReviewControlsProps from './types';

	let { disabled = false, onSubmitRating }: ManualReviewControlsProps = $props();

	const basicRatings: RatingButton[] = [
		{ value: 1, label: 'Again', color: tokens['text-error'], icon: 'refresh-ccw', shortcut: '1' },
		{ value: 2, label: 'Hard', color: tokens['text-warning'], icon: 'trending-up', shortcut: '2' },
		{ value: 3, label: 'Good', color: tokens['text-accent'], icon: 'check', shortcut: '3' },
		{ value: 4, label: 'Easy', color: tokens['text-success'], icon: 'zap', shortcut: '4' },
	];
</script>

<div class="ml-score-controls ml-score-controls--manual" class:disabled>
	{#each basicRatings as rating (rating.value)}
		<div class="ml-score-controls__button-wrapper">
			<Button
				variant="primary"
				className="ml-score-controls__button"
				onclick={() => !disabled && onSubmitRating(rating.value)}
				{disabled}
				ariaLabel="Rate as {rating.label}"
			>
				<div class="ml-score-controls__button-content">
					<Icon name={rating.icon || ''} size={18} />
					<span class="ml-score-controls__label">{rating.label}</span>
				</div>
			</Button>
			<span class="ml-score-controls__shortcut">{rating.shortcut}</span>
		</div>
	{/each}
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-score-controls {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: $spacing-md;
		width: 100%;
		margin-top: $spacing-lg;
	}

	.ml-score-controls.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.ml-score-controls__button-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $spacing-xs;
	}

	:global(button.ml-score-controls__button) {
		width: 100%;
		height: 60px;
		border-color: $background-modifier-border;
		transition: all 0.2s ease;
	}

	:global(.ml-score-controls__button:hover) {
		background-color: $background-secondary;
	}

	.ml-score-controls__button-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $spacing-xxs;
	}

	.ml-score-controls__label {
		font-size: 0.8rem;
		font-weight: 500;
	}

	.ml-score-controls__shortcut {
		font-size: 0.7rem;
		color: $text-muted;
		background-color: $background-secondary;
		padding: $spacing-xxs $spacing-xs;
		border-radius: $radius-sm;
		border: 1px solid $background-modifier-border;
	}

	/* Mobile optimizations */
	@media (max-width: 480px) {
		.ml-score-controls {
			gap: $spacing-sm;
			grid-template-columns: repeat(2, 1fr);
			margin-top: $spacing-md;
		}

		:global(button.ml-score-controls__button) {
			height: 56px;
			padding: $spacing-xs;
		}

		.ml-score-controls__label {
			font-size: 0.85rem;
		}

		.ml-score-controls__shortcut {
			display: none;
		}
	}
</style>
