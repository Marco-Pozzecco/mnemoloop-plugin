<script lang="ts">
	import { Icon } from '@/ui/components';
	import { Platform } from 'obsidian';
	import type AutoReviewControlsProps from './types';

	let { isCorrect, disabled = false, onContinue }: AutoReviewControlsProps = $props();

	let isTouchDevice = $state(Platform.isMobile);

	$effect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (disabled) return;
			if (event.code !== 'Space') return;
			if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
				return;
			}
			event.preventDefault();
			event.stopImmediatePropagation();
			onContinue();
		}

		function onTap(event: TouchEvent) {
			if (disabled) return;
			event.preventDefault();
			event.stopImmediatePropagation();
			onContinue();
		}

		if (isTouchDevice) {
			window.addEventListener('touchstart', onTap);
			return () => window.removeEventListener('touchstart', onTap);
		} else {
			window.addEventListener('keydown', onKeyDown);
			return () => window.removeEventListener('keydown', onKeyDown);
		}
	});
</script>

<div class="ml-score-controls ml-score-controls--auto" class:disabled>
	<div class="ml-score-controls__alert-wrapper">
		<div
			class="ml-score-controls__alert"
			class:correct={isCorrect}
			class:incorrect={!isCorrect}
		>
			<Icon
				className="ml-score-controls__alert-icon"
				name={isCorrect ? 'circle-check-big' : 'circle-x'}
				size={18}
			/>
			<p class="ml-score-controls__alert-label">{isCorrect ? 'Correct' : 'Incorrect'}</p>
		</div>
		<span class="ml-score-controls__tip">
			{#if isTouchDevice}
				<span class="ml-score-controls__shortcut" class:mobile={isTouchDevice}>Tap</span> to continue
			{:else}
				Press <span class="ml-score-controls__shortcut">Space</span> to continue
			{/if}
		</span>
	</div>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-score-controls {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		margin-top: $spacing-lg;
	}

	.ml-score-controls.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.ml-score-controls__alert-wrapper {
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: $spacing-md;
	}

	.ml-score-controls__alert {
		max-width: 300px;
		width: 100%;

		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding-left: $spacing-md;
		padding-right: $spacing-md;

		border-width: $border-width;
		border-style: solid;
		border-radius: $radius-sm;

		:global(.ml-score-controls__alert-icon) {
			position: absolute;
			top: 50%;
			transform: translateY(-50%);
			left: $spacing-md;
		}

		&.correct {
			border-color: $status-success;
			background: $status-success-background;

			:global(.ml-score-controls__alert-icon) {
				color: $status-success;
			}
		}

		&.incorrect {
			border-color: $status-error;
			background: $status-error-background;

			:global(.ml-score-controls__alert-icon) {
				color: $status-error;
			}
		}
	}

	.ml-score-controls__tip {
		color: $text-muted;

		.ml-score-controls__shortcut.mobile {
			display: inline;
		}
	}

	.ml-score-controls__shortcut {
		font-size: 0.7rem;
		color: $text-muted;
		background-color: $background-secondary;
		padding: $spacing-xxs $spacing-xs;
		border-radius: $radius-sm;
		border: 1px solid $background-modifier-border;
	}
</style>
