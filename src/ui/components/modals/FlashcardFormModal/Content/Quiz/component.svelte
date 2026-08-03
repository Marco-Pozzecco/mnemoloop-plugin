<script lang="ts">
	import type { FlashcardQuizContent } from '@/schemas';
	import { FormField, Input, Button, Icon } from '@/ui/components/elements';
	import type ContentTypeProps from '../types';
	import type { BuildContentFn, ValidateFn } from '../types';
	import { validateQuiz, buildQuizContent, remapCorrectIndexAfterRemove } from './validation';

	let { mode, initialContent, onRegister, disabled = false }: ContentTypeProps = $props();

	// --- Form state ---
	let question = $state('');
	let options = $state(['', '']);
	let correctIndex = $state(0);

	// --- Init from parent data (edit mode only) ---
	$effect(() => {
		if (mode === 'edit' && initialContent) {
			const c = initialContent as FlashcardQuizContent;
			question = c.question;
			options = [...c.options];
			correctIndex = c.correct_index;
		}
	});

	// --- Helpers ---
	function addOption(): void {
		options = [...options, ''];
	}

	function removeOption(index: number): void {
		if (options.length <= 2) return;
		correctIndex = remapCorrectIndexAfterRemove(index, correctIndex);
		options = options.filter((_, i) => i !== index);
	}

	// --- Register validate + buildContent with parent ---
	$effect(() => {
		const validate: ValidateFn = () => validateQuiz(question, options, correctIndex);
		const buildContent: BuildContentFn = () => buildQuizContent(question, options, correctIndex);
		onRegister({ validate, buildContent });
	});
</script>

<Input
	label="Question"
	value={question}
	required
	maxLength={1000}
	{disabled}
	onchange={(v) => (question = v)}
/>
<FormField label="Options">
	{#each options as option, i (i)}
		<div class="ml-field-list-item">
			<input
				type="checkbox"
				class="ml-field-list-radio"
				name="ml-quiz-correct"
				checked={correctIndex === i}
				{disabled}
				onchange={() => (correctIndex = i)}
			/>
			<Input
				label={`Option ${i + 1}`}
				value={option}
				required
				{disabled}
				onchange={(v) => (options[i] = v)}
			/>
			<Button
				variant="secondary"
				size="small"
				disabled={options.length <= 2 || disabled}
				onclick={() => removeOption(i)}
				ariaLabel="Remove"
			>
				<Icon name="trash-2" size={14} />
			</Button>
		</div>
	{/each}
	<Button variant="secondary" size="small" {disabled} onclick={addOption}>Add option</Button>
</FormField>

<style lang="scss">
	@use 'tokens' as *;

	.ml-field-list-item {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: $spacing-sm;
		align-items: center;

		:global(.ml-input-wrapper) {
			display: contents;
		}

		:global(.ml-input-label) {
			grid-column: 1 / -1;
		}

		:global(.ml-input-error),
		:global(.ml-input-helper) {
			grid-column: 1 / -1;
		}
	}

	.ml-field-list-radio {
		grid-row: 2;
		margin: 0;
		accent-color: $interactive-accent;
		width: 16px;
		height: 16px;
		flex-shrink: 0;

		&:checked:after {
			top: 50%;
			left: 50%;
			transform: translateY(-50%) translateX(-50%);
		}
	}
</style>
