<script lang="ts">
	import Toggle from '@/ui/components/elements/Toggle/component.svelte';
	import Select from '@/ui/components/elements/Select/component.svelte';
	import { RETENTION_PERIOD_OPTIONS } from '@/schemas/settings';
	import type DataManagementProps from './types';
	import { Card } from '@/ui/components/elements';

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

<section class="ml-data-management-section">
	<h3 class="ml-section-header">Data management</h3>

	<Card className="ml-settings-card">
		<div class="ml-field-group ml-settings-group">
			<Toggle
				label="Enable soft delete"
				checked={settings.enable_soft_delete}
				helperText="Keep deleted items recoverable for a period"
				onchange={handleToggleChange}
			/>
		</div>

		<div class="ml-field-group ml-settings-group">
			<Select
				label="Retention period (hours)"
				options={retentionOptions}
				value={String(settings.soft_delete_hours)}
				disabled={!settings.enable_soft_delete}
				helperText="How long to keep deleted items before permanent removal"
				hasError={hasError('soft_delete_hours')}
				errorMessage={getError('soft_delete_hours')}
				onchange={handleRetentionChange}
			/>
		</div>
	</Card>
</section>

<style lang="scss">
	@use 'tokens' as *;

	.ml-data-management-section {
		margin-top: $spacing-xxs;
	}

	.ml-section-header {
		color: $text-normal;
		margin: 0;
		margin-bottom: $spacing-md;
	}

	.ml-field-group {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
	}
</style>
