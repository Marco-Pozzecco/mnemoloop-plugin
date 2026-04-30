<script lang="ts">
	import Toggle from '@/ui/components/elements/Toggle/component.svelte';
	import Select from '@/ui/components/elements/Select/component.svelte';
	import { RETENTION_PERIOD_OPTIONS } from '@/schemas/settings';
	import type DataManagementProps from './types';

	let {
		settings,
		onFieldChange,
		hasError = () => false,
		getError = () => undefined,
	}: DataManagementProps = $props();

	function handleToggleChange(checked: boolean) {
		onFieldChange('enable_soft_delete', checked);
	}

	function handleRetentionChange(value: string) {
		onFieldChange('soft_delete_hours', parseInt(value));
	}

	// Convert RETENTION_PERIOD_OPTIONS to SelectOption format
	const retentionOptions = RETENTION_PERIOD_OPTIONS.map(
		(option: (typeof RETENTION_PERIOD_OPTIONS)[number]) => ({
			value: String(option.value),
			label: option.label,
		}),
	);
</script>

<section class="ka-data-management-section">
	<h3 class="ka-section-header">Data Management</h3>

	<div class="ka-field-group">
		<Toggle
			label="Enable Soft Delete"
			checked={settings.enable_soft_delete}
			helperText="Keep deleted items recoverable for a period"
			onchange={handleToggleChange}
		/>
	</div>

	<div class="ka-field-group">
		<Select
			label="Retention Period (hours)"
			options={retentionOptions}
			value={String(settings.soft_delete_hours)}
			disabled={!settings.enable_soft_delete}
			helperText="How long to keep deleted items before permanent removal"
			hasError={hasError('soft_delete_hours')}
			errorMessage={getError('soft_delete_hours')}
			onchange={handleRetentionChange}
		/>
	</div>
</section>

<style>
	.ka-data-management-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1rem 0;
	}

	.ka-section-header {
		font-size: var(--font-ui-medium);
		font-weight: var(--font-bold);
		color: var(--text-normal);
		margin: 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.ka-field-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
</style>
