<script lang="ts">
	import Input from '@/ui/components/elements/Input/component.svelte';
	import { Card } from '@/ui/components/elements';
	import type SourceNoteConfigProps from './types';

	let {
		settings,
		onNestedFieldChange,
		hasError = () => false,
		getError = () => undefined,
	}: SourceNoteConfigProps = $props();

	function handleDirectoryChange(value: string) {
		onNestedFieldChange(['source_note', 'watch', 'directory'], value);
	}

	function handleTagsChange(value: string) {
		const tags = value
			.split(',')
			.map((tag) => tag.trim())
			.filter((tag) => tag.length > 0);
		onNestedFieldChange(['source_note', 'watch', 'tags'], tags);
	}
</script>

<section class="ml-source-note-config-section">
	<h3 class="ml-section-header">Source note configuration</h3>

	<Card className="ml-settings-card">
		<div class="ml-settings-group">
			<Input
				label="Source note directory"
				value={settings.source_note.watch.directory}
				helperText="Directory matching is recursive. Directory and tags use OR criteria. Empty directory plus no tags disables source-note detection."
				hasError={hasError('source_note.watch.directory')}
				errorMessage={getError('source_note.watch.directory')}
				onchange={handleDirectoryChange}
			/>
		</div>

		<div class="ml-settings-group">
			<Input
				label="Source note tags"
				value={settings.source_note.watch.tags.join(', ')}
				helperText="Enter comma-separated # tags. Complete cached tags are used when available; frontmatter tags are the fallback."
				hasError={hasError('source_note.watch.tags')}
				errorMessage={getError('source_note.watch.tags')}
				onchange={handleTagsChange}
			/>
		</div>
	</Card>
</section>

<style lang="scss">
	@use 'tokens' as *;

	.ml-source-note-config-section {
		margin-top: 0;
	}

	.ml-section-header {
		color: $text-normal;
	}
</style>
