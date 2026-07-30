<script lang="ts">
	import { FormField, Input, Button } from '@/ui/components/elements';
	import type { FlashcardSequenceContent } from '@/schemas';
	import type ContentTypeProps from '../types';
	import type { ValidateFn, BuildContentFn } from '../types';
	import { validateSequence, buildSequenceContent } from './validation';

	let { mode, initialContent, onRegister, disabled = false }: ContentTypeProps = $props();

	// --- Form state ---
	let question = $state('');
	let steps = $state(['', '']);

	// --- Init from parent data (edit mode only) ---
	$effect(() => {
		if (mode === 'edit' && initialContent) {
			const c = initialContent as FlashcardSequenceContent;
			question = c.question;
			steps = [...c.steps];
		}
	});

	// --- Helpers ---
	function addStep(): void {
		steps = [...steps, ''];
	}

	function removeStep(index: number): void {
		if (steps.length <= 2) return;
		steps = steps.filter((_, i) => i !== index);
	}

	// --- Register validate + buildContent with parent ---
	$effect(() => {
		const validate: ValidateFn = () => validateSequence(question, steps);
		const buildContent: BuildContentFn = () => buildSequenceContent(question, steps);
		onRegister({ validate, buildContent });
	});
</script>

<Input label="Question" value={question} required maxLength={1000} {disabled} onchange={(v) => (question = v)} />
<FormField label="Steps">
	{#each steps as step, i (i)}
		<div class="ml-field-list-item">
			<Input
				class="ml-field-list-item__input"
				label={`Steps ${i + 1}`}
				value={step}
				required
				maxLength={500}
				{disabled}
				onchange={(v) => (steps[i] = v)}
			/>
			<Button
				class="ml-field-list-item__button"
				variant="secondary"
				size="small"
				disabled={steps.length <= 2 || disabled}
				onclick={() => removeStep(i)}
				ariaLabel="Remove">&times;</Button
			>
		</div>
	{/each}
	<Button variant="secondary" size="small" {disabled} onclick={addStep}>Add step</Button>
</FormField>

<style lang="scss">
	@use 'tokens' as *;

	.ml-field-list-item {
		display: grid;
		grid-template-columns: 1fr auto;
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
</style>
