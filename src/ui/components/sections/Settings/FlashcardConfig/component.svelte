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

	function handleTagsChange(value: string) {
		const tags = value
			.split(',')
			.map((t) => t.trim())
			.filter((t) => t.length > 0);
		onNestedFieldChange(['flashcard', 'watch', 'tags'], tags);
	}

	function handleMarkerChange(value: string) {
		onNestedFieldChange(['flashcard', 'marker'], value);
	}

	// Derive tags as comma-separated string for the input
	const tagsValue = $derived(settings.flashcard.watch.tags.join(', '));
</script>

<section class="flashcard-config-section">
	<h3 class="section-header">Flashcard Settings</h3>

	<div class="form-fields">
		<Input
			label="Flashcard directory"
			value={settings.flashcard.watch.directory}
			helperText="The path to flashcards root directory"
			hasError={hasError('flashcard.watch.directory')}
			errorMessage={getError('flashcard.watch.directory')}
			onchange={handleDirectoryChange}
		/>

		<!-- <Input -->
		<!-- 	label="Required Tags (comma-separated)" -->
		<!-- 	value={tagsValue} -->
		<!-- 	helperText="Tags required on notes (e.g., 'flashcard, srs')" -->
		<!-- 	hasError={hasError('flashcard.watch.tags')} -->
		<!-- 	errorMessage={getError('flashcard.watch.tags')} -->
		<!-- 	onchange={handleTagsChange} -->
		<!-- /> -->

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
	.flashcard-config-section {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.section-header {
		font-size: var(--font-ui-medium);
		font-weight: var(--font-medium);
		color: var(--text-normal);
		margin: 0;
		padding: 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
