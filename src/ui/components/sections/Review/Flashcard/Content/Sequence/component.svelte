<script lang="ts">
	import { DragDropProvider, KeyboardSensor, PointerSensor } from '@dnd-kit/svelte';
	import { isSortable } from '@dnd-kit/svelte/sortable';
	import SortableStep from './SortableStep.svelte';
	import { type MarkdownOptions, renderMarkdown } from '@/ui/actions/markdown';
	import type ReviewFlashcardSequenceProps from './types';
	import { fisherYatesShuffle } from '../utils';

	let { content, sourcePath, isAnswerShowing, onSetAnswerCorrectness }: ReviewFlashcardSequenceProps = $props();

	const questionOptions: MarkdownOptions = $derived({
		content: content?.question ?? '',
		sourcePath,
	});

	let shuffledSteps: { id: string; text: string }[] = $state([]);
	let correctSteps: string[] = $state([]);
	let lastStepsKey = $state('');

	$effect(() => {
		if (!content) return;

		const currentKey = JSON.stringify(content.steps);
		if (currentKey !== lastStepsKey) {
			lastStepsKey = currentKey;
			correctSteps = content.steps;
			shuffledSteps = fisherYatesShuffle(
				content.steps.map((text: string, i: number) => ({
					id: `step-${i}-${text.slice(0, 10)}`,
					text,
				})),
			);
		}
	});

	const isCorrect = $derived(
		correctSteps.length > 0 && correctSteps.every((step, i) => shuffledSteps[i]?.text === step),
	);

	$effect(() => {
		onSetAnswerCorrectness?.(isCorrect);
	});

	function arrayMove<T>(array: T[], from: number, to: number): T[] {
		const result = [...array];
		const [removed] = result.splice(from, 1);
		result.splice(to, 0, removed);
		return result;
	}

	function handleDragOver(event: {
		operation: {
			source: import('@dnd-kit/dom').Draggable | null;
			target: import('@dnd-kit/dom').Droppable | null;
		};
	}) {
		if (isAnswerShowing) return;
		const { source, target } = event.operation;
		if (!isSortable(source) || !isSortable(target)) return;

		const from = source.index;
		const to = target.index;
		if (from === to) return;

		shuffledSteps = arrayMove(shuffledSteps, from, to);
	}

	function handleDragEnd() {
		if (isAnswerShowing) return;
		// Reordering is handled in onDragOver; nothing to do here on successful drop.
		// On cancel, the user released the drag outside a valid target — steps retain their
		// last onDragOver position, which is the intended behavior.
	}
</script>

<div class="ml-sequence-content">
	<div class="ml-sequence-question" use:renderMarkdown={questionOptions}></div>

	<DragDropProvider
		sensors={() => [PointerSensor, KeyboardSensor]}
		onDragEnd={handleDragEnd}
		onDragOver={handleDragOver}
	>
		{#if isAnswerShowing}
			<div class="ml-sequence-list">
				{#each correctSteps as step, i (i)}
					<div
						class="ml-sequence-step"
						class:ml-sequence-step-correct={shuffledSteps[i]?.text === step}
					>
						<span class="ml-sequence-step-index">{i + 1}</span>
						<div class="ml-sequence-step-text" use:renderMarkdown={{ content: step, sourcePath }}></div>
						{#if shuffledSteps[i]?.text !== step}
							<div
								class="ml-sequence-step-original"
								use:renderMarkdown={{ content: shuffledSteps[i]?.text ?? '', sourcePath }}
							></div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="ml-sequence-list">
				{#each shuffledSteps as step, i (step.id)}
					<SortableStep id={step.id} index={i} text={step.text} {sourcePath} />
				{/each}
			</div>
		{/if}
	</DragDropProvider>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-sequence-content {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
	}

	.ml-sequence-question {
		line-height: 1.6;
	}

	.ml-sequence-list {
		display: flex;
		flex-direction: column;
		gap: $spacing-xxs;
	}

	.ml-sequence-step {
		display: flex;
		align-items: flex-start;
		gap: $spacing-sm;
		padding: $spacing-sm $spacing-md;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-md;
	}

	.ml-sequence-step-correct {
		border-color: var(--color-green);
		background: rgba(var(--color-green-rgb), 0.1);
	}

	.ml-sequence-step-index {
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
	}

	.ml-sequence-step-text {
		min-width: 0;
		flex: 1;
		line-height: 1.4;
	}

	.ml-sequence-step-original {
		min-width: 0;
		flex: 1;
		font-size: 0.8rem;
		color: $text-muted;
		text-decoration: line-through;
	}
</style>
