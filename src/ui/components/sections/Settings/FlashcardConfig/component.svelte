<script lang="ts">
	import Input from '@/ui/components/elements/Input/component.svelte';
	import type FlashcardConfigProps from './types';

	let {
		settings,
		onNestedFieldChange,
		hasError = () => false,
		getError = () => undefined,
	}: FlashcardConfigProps = $props();

	function handleDirectoryChange(value: string) {
		onNestedFieldChange(['flashcard', 'watch', 'directory'], value);
	}

	function handleMarkerChange(value: string) {
		onNestedFieldChange(['flashcard', 'marker'], value);
	}
</script>

<section class="ml-flashcard-config-section">
	<h3 class="ml-section-header">Flashcard configuration</h3>

	<div class="ml-form-fields">
		<Input
			label="Flashcard directory"
			value={settings.flashcard.watch.directory}
			helperText="The path to flashcards root directory"
			hasError={hasError('flashcard.watch.directory')}
			errorMessage={getError('flashcard.watch.directory')}
			onchange={handleDirectoryChange}
		/>

		<Input
			label="Flashcard marker"
			value={settings.flashcard.marker}
			helperText="The marker that split front and back content"
			hasError={hasError('flashcard.marker')}
			errorMessage={getError('flashcard.marker')}
			onchange={handleMarkerChange}
		/>
	</div>
</section>

<style>
	.ml-flashcard-config-section {
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
</style>
