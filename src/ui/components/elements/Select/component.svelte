<script lang="ts">
	import { Select } from 'bits-ui';
	import type { SelectProps } from './types';
	import { Icon } from '..';

	let {
		id = `ml-select-${Math.random().toString(36).substring(2, 9)}`,
		label,
		options,
		value = $bindable(''),
		placeholder = '',
		disabled = false,
		required = false,
		hasError = false,
		errorMessage = '',
		helperText,
		className = '',
		ariaLabel = '',
		onchange,
		displayAs,
	}: SelectProps = $props();

	// Handle value changes from bits-ui
	function handleValueChange(newValue: string | undefined) {
		const stringValue = newValue ?? '';
		value = stringValue;
		onchange?.(stringValue);
	}

	// Build aria-describedby attribute
	function buildAriaDescribedBy(): string | undefined {
		if (hasError) return `${id}-error`;
		if (helperText) return `${id}-helper`;
		return undefined;
	}
</script>

<div class="ml-select-wrapper {className}" class:has-error={hasError}>
	{#if label}
		<label for={id} class="ml-select-label">
			{label}
			{#if required}
				<span class="ml-select-required">*</span>
			{/if}
		</label>
	{/if}

	<Select.Root
		type="single"
		bind:value
		onValueChange={handleValueChange}
		{disabled}
		required={required || false}
	>
		<Select.Trigger
			{id}
			aria-label={ariaLabel || undefined}
			aria-invalid={hasError}
			aria-describedby={buildAriaDescribedBy()}
		>
			{#snippet child({ props })}
				<button {...props} class="ml-select" type="button">
					<Select.Value {placeholder}>
						{#snippet children({ selection })}
							{@const selected = selection.type === 'single' ? selection.selected : undefined}
							{displayAs && selected ? displayAs(selected.value) : (selected?.label ?? '')}
						{/snippet}
					</Select.Value>
					<Icon class="ml-select__icon" name="chevron-down" size={14} />
				</button>
			{/snippet}
		</Select.Trigger>
		<Select.Portal>
			<Select.Content class="ml-select-content">
				<Select.Viewport class="ml-select-viewport">
					{#each options as option (option.value)}
						<Select.Item value={option.value} disabled={option.disabled} class="ml-select-item">
							{#snippet children({ selected })}
								<span class="ml-select-item-label">{option.label}</span>
								{#if selected}
									<span class="ml-select-item-indicator">✓</span>
								{/if}
							{/snippet}
						</Select.Item>
					{/each}
				</Select.Viewport>
			</Select.Content>
		</Select.Portal>
	</Select.Root>

	{#if hasError && errorMessage}
		<div id="{id}-error" class="ml-select-error">{errorMessage}</div>
	{:else if helperText}
		<div id="{id}-helper" class="ml-select-helper">{helperText}</div>
	{/if}
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-select-wrapper {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		width: 100%;
	}

	.ml-select-label {
		font-size: $font-xs;
		font-weight: $font-md;
		color: $text-normal;
		margin-bottom: 0;
		display: flex;
		align-items: center;
		gap: $spacing-xxs;
	}

	.ml-select-required {
		color: $text-error;
		font-weight: bold;
	}

	.ml-select {
		width: 100%;
		padding: $spacing-sm $spacing-sm;
		font-family: inherit;
		font-size: $font-sm;
		color: $text-normal;
		background-color: $background-primary;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-input;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
		min-height: 44px;
		cursor: pointer;
		text-align: left;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.ml-select:hover:not([data-disabled]) {
		border-color: $background-modifier-border-hover;
	}

	.ml-select[data-state='open'] {
		border-color: $interactive-accent;
		box-shadow: 0 0 0 2px $background-modifier-border-focus;

		& :global(.ml-select__icon) {
			transform: rotate(180deg);
			transition: transform $transition-fast;
		}
	}

	.ml-select:focus-visible {
		outline: none;
		border-color: $interactive-accent;
		box-shadow: 0 0 0 2px $background-modifier-border-focus;
	}

	.ml-select[data-disabled] {
		background-color: $background-secondary;
		color: $text-muted;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.ml-select-wrapper.has-error .ml-select {
		border-color: $text-error;
		background-color: color-mix(in srgb, $text-error 5%, transparent);
	}

	.ml-select-wrapper.has-error .ml-select:focus-visible {
		box-shadow: 0 0 0 2px color-mix(in srgb, $text-error 10%, transparent);
	}

	/* Dropdown content styles */
	:global(.ml-select-content) {
		background-color: $background-primary;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-input;
		box-shadow: 0 4px 12px color-mix(in srgb, $text-normal 15%, transparent);
		z-index: 50;
		min-width: var(--bits-floating-anchor-width);
	}

	:global(.ml-select-viewport) {
		padding: $spacing-xxs;
		max-height: 300px;
		overflow-y: auto;
	}

	:global(.ml-select-item) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: $spacing-xs $spacing-sm;
		font-size: $font-sm;
		color: $text-normal;
		cursor: pointer;
		border-radius: $radius-sm;
		transition: background-color 0.15s ease;
	}

	:global(.ml-select-item:hover:not([data-disabled])) {
		background-color: $background-modifier-hover;
	}

	:global(.ml-select-item[data-selected]) {
		background-color: $background-modifier-active;
	}

	:global(.ml-select-item[data-disabled]) {
		color: $text-muted;
		cursor: not-allowed;
		opacity: 0.5;
	}

	:global(.ml-select-item-label) {
		flex: 1;
	}

	:global(.ml-select-item-indicator) {
		color: $interactive-accent;
		font-weight: bold;
		margin-left: 0.5rem;
	}

	.ml-select-error,
	.ml-select-helper {
		font-size: $font-xs;
		line-height: 1.4;
	}

	.ml-select-error {
		color: $text-error;
	}

	.ml-select-helper {
		color: $text-muted;
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ml-select {
			padding: $spacing-xs $spacing-sm;
			font-size: 1rem; /* Prevent iOS zoom */
		}

		:global(.ml-select-item) {
			padding: $spacing-sm $spacing-sm;
			font-size: 1rem;
		}
	}
</style>
