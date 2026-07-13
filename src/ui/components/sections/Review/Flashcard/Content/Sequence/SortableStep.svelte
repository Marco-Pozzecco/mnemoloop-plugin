<script lang="ts">
	import { createSortable } from '@dnd-kit/svelte/sortable';

	let {
		id,
		index,
		text,
		showAnswer = false,
		isCorrect = false,
	}: {
		id: string;
		index: number;
		text: string;
		showAnswer?: boolean;
		isCorrect?: boolean;
	} = $props();

	const sortable = $derived(createSortable({ id, index }));
</script>

<div
	{@attach sortable.attach}
	class="ml-sequence-step"
	class:ml-sequence-step-correct={showAnswer && isCorrect}
	class:ml-sequence-step-incorrect={showAnswer && !isCorrect}
	class:ml-sequence-step-answer={showAnswer}
>
	<span class="ml-sequence-step-index">{index + 1}</span>
	<span class="ml-sequence-step-text">{text}</span>
	<span {@attach sortable.attachHandle} class="ml-sequence-step-handle" aria-label="Drag to reorder">
		⠿
	</span>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-sequence-step {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		padding: $spacing-sm $spacing-md;
		margin-bottom: $spacing-xs;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-md;
		cursor: grab;
		user-select: none;
		touch-action: none;

		&:active {
			cursor: grabbing;
		}

		&:hover {
			background: $background-secondary;
		}
	}

	.ml-sequence-step-answer {
		cursor: default;
	}

	.ml-sequence-step-correct {
		border-color: var(--color-green);
		background: rgba(var(--color-green-rgb), 0.1);
	}

	.ml-sequence-step-incorrect {
		border-color: var(--color-red);
		background: rgba(var(--color-red-rgb), 0.1);
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
		flex: 1;
		line-height: 1.4;
	}

	.ml-sequence-step-handle {
		cursor: grab;
		padding: $spacing-xxs;
		font-size: 1.2rem;
		opacity: 0.5;
		line-height: 1;
		flex-shrink: 0;

		&:active {
			cursor: grabbing;
			opacity: 1;
		}
	}
</style>
