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

<section class="ka-flashcard-config-section">
	<h3 class="ka-section-header">Flashcard Settings</h3>

	<div class="ka-form-fields">
		<Input
			label="Flashcard directory"
			value={settings.flashcard.watch.directory}
			helperText="The path to flashcards root directory"
			hasError={hasError('flashcard.watch.directory')}
			errorMessage={getError('flashcard.watch.directory')}
			onchange={handleDirectoryChange}
		/>

		<Input
			label="Flashcard Marker"
			value={settings.flashcard.marker}
			helperText="The marker that split front and back content"
			hasError={hasError('flashcard.marker')}
			errorMessage={getError('flashcard.marker')}
			onchange={handleMarkerChange}
		/>
	</div>
</section>

<style>
	.ka-flashcard-config-section {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.ka-section-header {
		font-size: var(--font-ui-medium);
		font-weight: var(--font-medium);
		color: var(--text-normal);
		margin: 0;
		padding: 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.ka-form-fields {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
