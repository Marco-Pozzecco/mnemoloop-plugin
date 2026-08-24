<script lang="ts">
	import { type FlashcardQuizContent } from '@/schemas';
	import { type MarkdownOptions, renderMarkdown } from '@/ui/actions/markdown';
	import type { FlashcardContentProps } from '../types';
	import { fisherYatesShuffle } from '../utils';

	let {
		content,
		sourcePath,
		isAnswerShowing,
		onSetAnswerCorrectness,
		onShowAnswer,
	}: FlashcardContentProps<FlashcardQuizContent> = $props();

	interface ShuffledOption {
		id: string;
		text: string;
		original_index: number;
	}

	let shuffledOptions: ShuffledOption[] = $state([]);
	let correctOriginalIndex = $state(0);
	let selectedShuffledIndex: number | null = $state(null);
	let lastKey = $state('');
	let containerRef: HTMLDivElement;

	const questionOptions: MarkdownOptions = $derived({
		content: content?.question ?? '',
		sourcePath,
	});

	const isCorrect = $derived(
		selectedShuffledIndex !== null &&
			shuffledOptions[selectedShuffledIndex]?.original_index === correctOriginalIndex,
	);

	$effect(() => {
		onSetAnswerCorrectness?.(isCorrect);
	});

	$effect(() => {
		if (!content) return;

		const currentKey = JSON.stringify(content.options);
		if (currentKey !== lastKey) {
			lastKey = currentKey;
			correctOriginalIndex = content.correct_index;
			shuffledOptions = fisherYatesShuffle(
				content.options.map((text: string, i: number) => ({
					id: `quiz-opt-${i}`,
					text,
					original_index: i,
				})),
			);
			selectedShuffledIndex = null;
		}
	});

	function selectOption(index: number) {
		if (isAnswerShowing) return;
		if (selectedShuffledIndex === index) {
			onShowAnswer?.();
			return;
		}
		selectedShuffledIndex = index;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (isAnswerShowing) return;
		if (!containerRef || containerRef.offsetParent === null) {
			return;
		}

		const numKey = parseInt(event.key, 10);
		if (numKey >= 1 && numKey <= 9 && numKey <= shuffledOptions.length) {
			event.preventDefault();
			selectOption(numKey - 1);
		}
	}
	function handleOptionKeyDown(event: KeyboardEvent, index: number) {
		if (isAnswerShowing) return;
		if (event.key === 'Enter' || event.key === ' ' || event.code === 'Space') {
			event.preventDefault();
			selectOption(index);
		}
	}

</script>

<svelte:window onkeydown={handleKeyDown} />

<div bind:this={containerRef} class="ml-quiz-content">
	<div class="ml-quiz-question" use:renderMarkdown={questionOptions}></div>

	<div class="ml-quiz-options" role="radiogroup" aria-label="Answer options">
		{#each shuffledOptions as option, i (option.id)}
			{@const isSelected = selectedShuffledIndex === i}
			{@const isCorrectOption = option.original_index === correctOriginalIndex}
			<div
				class="ml-quiz-option"
				class:ml-quiz-option-selected={isSelected && !isAnswerShowing}
				class:ml-quiz-option-correct={isAnswerShowing && isCorrectOption}
				class:ml-quiz-option-incorrect={isAnswerShowing && isSelected && !isCorrectOption}
				class:ml-quiz-option-dimmed={isAnswerShowing && !isSelected && !isCorrectOption}
				role="radio"
				tabindex={isAnswerShowing ? -1 : 0}
				aria-checked={isSelected}
				aria-disabled={isAnswerShowing}
				onclick={() => selectOption(i)}
				onkeydown={(event) => handleOptionKeyDown(event, i)}
			>
				<span class="ml-quiz-option-key">{i + 1}</span>
				<div class="ml-quiz-option-text" use:renderMarkdown={{ content: option.text, sourcePath }}></div>
			</div>
		{/each}
	</div>

</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-quiz-content {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
	}

	.ml-quiz-question {
		line-height: 1.6;
	}

	.ml-quiz-options {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
	}

	.ml-quiz-option {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		padding: $spacing-xs $spacing-md;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-md;
		background: $background-primary;
		cursor: pointer;
		text-align: left;
		width: 100%;
		height: fit-content;
		font-size: inherit;
		font-family: inherit;
		color: $text-normal;
		transition:
			border-color $transition-fast,
			background $transition-fast;

		&:hover:not([aria-disabled='true']) {
			background: $background-modifier-hover;
		}

		&[aria-disabled='true'] {
			cursor: default;
		}

	}

	.ml-quiz-option-selected {
		border-color: $interactive-accent;
		background: $background-modifier-hover;
	}

	.ml-quiz-option-correct {
		border-color: $green;
		background: rgba($green-rgb, 0.1);
		color: $green;
	}

	.ml-quiz-option-incorrect {
		border-color: $red;
		background: rgba($red-rgb, 0.1);
		color: $red;
	}

	.ml-quiz-option-dimmed {
		opacity: 0.5;
	}

	.ml-quiz-option-key {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: $background-modifier-border;
		font-size: 0.75rem;
		font-weight: bold;
		flex-shrink: 0;

		.ml-quiz-option-correct & {
			background: rgba($green-rgb, 0.2);
		}

		.ml-quiz-option-incorrect & {
			background: rgba($red-rgb, 0.2);
		}
	}

	.ml-quiz-option-text {
		flex: 1;
		min-width: 0;
		white-space: pre-wrap;
		word-break: break-word;
		line-height: 1.4;
	}

	@media (max-width: 480px) {
		.ml-quiz-content {
			gap: $spacing-sm;
		}

		.ml-quiz-option {
			padding: $spacing-md $spacing-sm;
		}
	}
</style>
