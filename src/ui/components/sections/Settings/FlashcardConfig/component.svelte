<script lang="ts">
	import Input from '@/ui/components/elements/Input/component.svelte';
	import type FlashcardConfigProps from './types';
	import { Card } from '@/ui/components/elements';

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

	<Card className="ml-settings-card">
		<div class="ml-settings-group">
			<Input
				label="Flashcard directory"
				value={settings.flashcard.watch.directory}
				helperText="The path to flashcards root directory"
				hasError={hasError('flashcard.watch.directory')}
				errorMessage={getError('flashcard.watch.directory')}
				onchange={handleDirectoryChange}
			/>
		</div>

		<div class="ml-settings-group">
			<Input
				label="Flashcard marker"
				value={settings.flashcard.marker}
				helperText="The marker that split front and back content"
				hasError={hasError('flashcard.marker')}
				errorMessage={getError('flashcard.marker')}
				onchange={handleMarkerChange}
			/>
		</div>
	</Card>
</section>

<style>
	.ml-flashcard-config-section {
		margin-top: 0;
	}

	.ml-section-header {
		color: var(--text-normal);
	}
</style>
