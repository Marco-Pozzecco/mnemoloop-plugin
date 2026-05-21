<script lang="ts">
	import { settingsStore } from '@/ui/store/settings.store';
	import type { PluginSettings } from '@/schemas/settings';
	import FlashcardConfig from '@/ui/components/sections/Settings/FlashcardConfig/component.svelte';
	import DataManagement from '@/ui/components/sections/Settings/DataManagement/component.svelte';
	import DangerZone from '@/ui/components/sections/Settings/DangerZone/component.svelte';

	// Access the individual Svelte stores from the SettingsStore instance
	const settingsWritable = settingsStore.settings;
	const isLoadingWritable = settingsStore.isLoading;
	const saveErrorWritable = settingsStore.saveError;
	const fieldErrorsWritable = settingsStore.fieldErrors;

	// Use $derived to subscribe to stores with Svelte 5 runes
	const settings = $derived($settingsWritable);
	const isLoading = $derived($isLoadingWritable);
	const saveError = $derived($saveErrorWritable);
	const fieldErrors = $derived($fieldErrorsWritable);

	// Event handlers
	function handleNestedFieldChange(path: string[], value: unknown) {
		settingsStore.updateNestedField(path, value);
		settingsStore.save();
	}

	function handleFieldChange(key: string, value: unknown) {
		const typedValue = value as PluginSettings[keyof PluginSettings];
		settingsStore.updateField(key as keyof PluginSettings, typedValue);
		settingsStore.save();
	}

	async function handleReset() {
		await settingsStore.reset();
	}

	function hasError(key: string): boolean {
		return !!fieldErrors[key];
	}

	function getError(key: string): string | undefined {
		return fieldErrors[key];
	}
</script>

<div class="ml-settings">
	{#if saveError}
		<div class="ml-settings__error">{saveError}</div>
	{/if}

	<div class="ml-settings__sections">
		<FlashcardConfig
			{settings}
			onFieldChange={handleFieldChange}
			onNestedFieldChange={handleNestedFieldChange}
			{hasError}
			{getError}
		/>

		<DataManagement {settings} onFieldChange={handleFieldChange} {hasError} {getError} />

		<DangerZone onReset={handleReset} {isLoading} />
	</div>
</div>

<style>
	.ml-settings {
		padding: var(--size-4-3);
		max-width: 800px;
	}

	.ml-settings__error {
		color: var(--text-error);
		background-color: rgba(var(--text-error-rgb, 255, 0, 0), 0.1);
		border: 1px solid var(--text-error);
		border-radius: var(--radius-m);
		padding: var(--size-4-2);
		margin-bottom: var(--size-4-3);
		font-size: var(--font-ui-small);
	}

	.ml-settings__sections {
		display: flex;
		flex-direction: column;
		gap: var(--size-4-4);
	}
</style>
