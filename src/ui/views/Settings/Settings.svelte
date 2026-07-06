<script lang="ts">
	import { settingsStore } from '@/ui/store/settings.store';
	import type { PluginSettings } from '@/schemas/settings';
	import FlashcardConfig from '@/ui/components/sections/Settings/FlashcardConfig/component.svelte';
	import FsrsParams from '@/ui/components/sections/Settings/FsrsParams/component.svelte';
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
	async function handleNestedFieldChange(path: string[], value: unknown) {
		await settingsStore.updateNestedField(path, value);
		await settingsStore.save();
	}

	async function handleFieldChange(key: string, value: unknown) {
		const typedValue = value as PluginSettings[keyof PluginSettings];
		await settingsStore.updateField(key as keyof PluginSettings, typedValue);
		await settingsStore.save();
	}

	async function handleReset() {
		await settingsStore.reset();
		await settingsStore.save();
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

		<FsrsParams {settings} onNestedFieldChange={handleNestedFieldChange} {hasError} {getError} />

		<DataManagement {settings} onFieldChange={handleFieldChange} {hasError} {getError} />

		<DangerZone onReset={handleReset} {isLoading} />
	</div>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-settings {
		padding: $spacing-sm;
		max-width: 800px;

		&__sections {
			display: flex;
			flex-direction: column;
			gap: $spacing-md;
		}

		&__error {
			color: -error;
			background-color: rgba(#{$text-error-rgb}, 0.1);
			border: 1px solid -error;
			border-radius: $radius-md;
			padding: $spacing-sm;
			margin-bottom: $spacing-sm;
			font-size: $font-sm;
		}
	}
</style>
