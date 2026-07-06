<script lang="ts">
	import { Button, Icon } from '@/ui/components';
	import type { RatingButton } from './types';
	import type RatingControlsProps from './types';
	import { tokens } from '@/utils/token';

	// props
	let { onSubmitRating, disabled = false }: RatingControlsProps = $props();

	const ratings: RatingButton[] = [
		{ value: 1, label: 'Again', color: tokens['text-error'], icon: 'refresh-ccw', shortcut: '1' },
		{ value: 2, label: 'Hard', color: tokens['text-warning'], icon: 'trending-up', shortcut: '2' },
		{ value: 3, label: 'Good', color: tokens['text-accent'], icon: 'check', shortcut: '3' },
		{ value: 4, label: 'Easy', color: tokens['text-success'], icon: 'zap', shortcut: '4' },
	];
</script>

<div class="ml-rating-controls" class:disabled>
	{#each ratings as rating (rating.value)}
		<div class="ml-rating-button-wrapper">
			<Button
				variant="primary"
				className="ml-rating-button"
				onclick={() => !disabled && onSubmitRating(rating.value)}
				{disabled}
				ariaLabel="Rate as {rating.label}"
			>
				<div class="ml-rating-button-content">
					<Icon name={rating.icon || ''} size={18} />
					<span class="ml-rating-label">{rating.label}</span>
				</div>
			</Button>
			<span class="ml-rating-shortcut">{rating.shortcut}</span>
		</div>
	{/each}
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-rating-controls {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: $spacing-md;
		width: 100%;
		margin-top: $spacing-lg;
	}

	.ml-rating-controls.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.ml-rating-button-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $spacing-xs;
	}

	:global(button.ml-rating-button) {
		width: 100%;
		height: 60px;
		border-color: $background-modifier-border;
		transition: all 0.2s ease;
	}

	:global(.ml-rating-button:hover) {
		background-color: $background-secondary;
	}

	.ml-rating-button-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $spacing-xxs;
	}

	.ml-rating-label {
		font-size: 0.8rem;
		font-weight: 500;
	}

	.ml-rating-shortcut {
		font-size: 0.7rem;
		color: $text-muted;
		background-color: $background-secondary;
		padding: $spacing-xxs $spacing-xs;
		border-radius: $radius-sm;
		border: 1px solid $background-modifier-border;
	}

	/* Mobile optimizations */
	@media (max-width: 480px) {
		.ml-rating-controls {
			gap: $spacing-sm;
			grid-template-columns: repeat(2, 1fr);
			margin-top: $spacing-md;
		}

		:global(button.ml-rating-button) {
			height: 56px;
			padding: $spacing-xs;
		}

		.ml-rating-label {
			font-size: 0.85rem;
		}

		.ml-rating-shortcut {
			display: none;
		}
	}
</style>
