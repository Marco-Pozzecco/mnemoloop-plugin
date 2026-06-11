<script lang="ts">
	import Input from '@/ui/components/elements/Input/component.svelte';
	import Toggle from '@/ui/components/elements/Toggle/component.svelte';
	import Preview from './Preview.svelte';
	import type FsrsParamsProps from './types';
	import { Slider } from '@/ui/components/elements';

	let {
		settings,
		onNestedFieldChange,
		hasError = () => false,
		getError = () => undefined,
	}: FsrsParamsProps = $props();

	let stepsError = $state('');
	let relearningStepsError = $state('');

	const config = $derived(settings.flashcard.fsrs);

	function handleRequestRetentionChange(value: number) {
		onNestedFieldChange(['flashcard', 'fsrs', 'request_retention'], value);
	}

	function handleMaximumIntervalChange(value: string) {
		const num = parseInt(value, 10);
		if (!isNaN(num)) {
			onNestedFieldChange(['flashcard', 'fsrs', 'maximum_interval'], num);
		}
	}

	function handleEnableFuzzChange(value: boolean) {
		onNestedFieldChange(['flashcard', 'fsrs', 'enable_fuzz'], value);
	}

	function handleEnableShortTermChange(value: boolean) {
		onNestedFieldChange(['flashcard', 'fsrs', 'enable_short_term'], value);
	}

	function validateSteps(value: string): string[] | null {
		const steps = value
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		const valid = steps.every((s) => /^\d+[mhd]$/.test(s));
		return valid ? steps : null;
	}

	function handleLearningStepsChange(value: string) {
		const steps = validateSteps(value);
		if (steps) {
			stepsError = '';
			onNestedFieldChange(['flashcard', 'fsrs', 'learning_steps'], steps);
		} else {
			stepsError = 'Each step must be a number followed by m, h, or d (e.g. 1m, 10m)';
		}
	}

	function handleRelearningStepsChange(value: string) {
		const steps = validateSteps(value);
		if (steps) {
			relearningStepsError = '';
			onNestedFieldChange(['flashcard', 'fsrs', 'relearning_steps'], steps);
		} else {
			relearningStepsError = 'Each step must be a number followed by m, h, or d (e.g. 1m, 10m)';
		}
	}
</script>

<section class="ml-fsrs-params-section">
	<h3 class="ml-section-header">FSRS Parameters</h3>

	<div class="ml-form-fields">
		<Slider
			label="Retention rate"
			value={settings.flashcard.fsrs.request_retention}
			min={0.8}
			max={1}
			step={0.01}
			onchange={handleRequestRetentionChange}
			helperText="Target probability of recall (0.8–1)"
			hasError={hasError('flashcard.fsrs.request_retention')}
			errorMessage={getError('flashcard.fsrs.request_retention')}
			tooltip
		/>

		<Input
			label="Maximum interval"
			type="number"
			value={settings.flashcard.fsrs.maximum_interval.toString()}
			min={1}
			helperText="Maximum number of days between reviews"
			hasError={hasError('flashcard.fsrs.maximum_interval')}
			errorMessage={getError('flashcard.fsrs.maximum_interval')}
			onchange={handleMaximumIntervalChange}
		/>

		<Toggle
			label="Enable fuzz"
			checked={settings.flashcard.fsrs.enable_fuzz}
			helperText="Add small random variations to intervals"
			onchange={handleEnableFuzzChange}
		/>

		<Toggle
			label="Enable short term"
			checked={settings.flashcard.fsrs.enable_short_term}
			helperText="Allow learning/relearning steps in minutes/hours"
			onchange={handleEnableShortTermChange}
		/>

		<Input
			label="Learning steps"
			type="text"
			value={settings.flashcard.fsrs.learning_steps.join(', ')}
			helperText="Comma-separated steps (e.g. 1m, 10m)"
			hasError={!!stepsError}
			errorMessage={stepsError}
			onchange={handleLearningStepsChange}
		/>

		<Input
			label="Relearning steps"
			type="text"
			value={settings.flashcard.fsrs.relearning_steps.join(', ')}
			helperText="Comma-separated steps (e.g. 10m)"
			hasError={!!relearningStepsError}
			errorMessage={relearningStepsError}
			onchange={handleRelearningStepsChange}
		/>
	</div>

	<div class="ml-fsrs-preview-wrapper">
		<Preview {config} />
	</div>
</section>

<style>
	.ml-fsrs-params-section {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.ml-section-header {
		color: var(--text-normal);
		margin: 0;
		padding: 0 0 0.5rem 0;
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.ml-form-fields {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.ml-fsrs-preview-wrapper {
		margin-top: 0.5rem;
		padding: 0.75rem;
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-m);
		background-color: var(--background-modifier-form-field);
	}
</style>
