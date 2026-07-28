<script lang="ts">
	import type { FlashcardContent, FlashcardQuizContent } from '@/schemas';
	import { CardType } from '@/schemas';
	import { FormField, Input, Button } from '@/ui/components/elements';
	import type ContentTypeProps from '../types';
	import type { BuildContentFn, ValidateFn } from '../types';

	let { mode, initialContent, onRegister }: ContentTypeProps = $props();

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
		options = options.filter((_, i) => i !== index);
		if (correctIndex >= options.length) {
			correctIndex = options.length - 1;
		}
	}

	// --- Register validate + buildContent with parent ---
	$effect(() => {
		const validate: ValidateFn = () => {
			if (!question.trim()) return 'Question is required.';
			const filled = options.filter((o) => o.trim());
			if (filled.length < 2) return 'At least 2 options are required.';
			return null;
		};
		const buildContent: BuildContentFn = () =>
			({
				meta_type: CardType.Quiz,
				question: question.trim(),
				options: options.map((o) => o.trim()).filter((o) => o.length > 0),
				correct_index: correctIndex,
			}) as FlashcardContent;
		onRegister({ validate, buildContent });
	});
</script>

<Input label="Question" value={question} required onchange={(v) => (question = v)} />
<FormField label="Options">
	{#each options as option, i (i)}
		<div class="ml-field-list-item">
			<input
				type="radio"
				class="ml-field-list-radio"
				name="ml-quiz-correct"
				checked={correctIndex === i}
				onchange={() => (correctIndex = i)}
			/>
			<Input label={`Option ${i + 1}`} value={option} required onchange={(v) => (options[i] = v)} />
			<Button
				variant="secondary"
				size="medium"
				disabled={options.length <= 2}
				onclick={() => removeOption(i)}
				ariaLabel="Remove">&times;</Button
			>
		</div>
	{/each}
	<Button variant="secondary" size="small" onclick={addOption}>Add option</Button>
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
			grid-column: 2 / -1;
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
	}
</style>
