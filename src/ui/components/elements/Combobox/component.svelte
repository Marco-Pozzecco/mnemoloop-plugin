<script lang="ts">
	import { Combobox } from 'bits-ui';
	import type { ComboboxProps } from './types';

	let {
		id = `ml-combobox-${Math.random().toString(36).substring(2, 9)}`,
		label,
		options,
		value = $bindable(''),
		placeholder = '',
		searchPlaceholder = 'Search\u2026',
		disabled = false,
		required = false,
		hasError = false,
		errorMessage = '',
		helperText,
		className = '',
		onchange,
		displayAs,
	}: ComboboxProps = $props();

	// Internal search state — cleared on dropdown close
	let searchTerm = $state('');

	// Derived filtered options — case-insensitive match against option.label
	// Empty search shows all options
	let filteredOptions = $derived(
		searchTerm.trim() === ''
			? options
			: options.filter((option) =>
					option.label.toLowerCase().includes(searchTerm.trim().toLowerCase())
				)
	);

	// Derived display text for the trigger
	let selectedOption = $derived(options.find((option) => option.value === value));
	let triggerDisplay = $derived(
		selectedOption
			? displayAs
				? displayAs(selectedOption.value)
				: selectedOption.label
			: placeholder
	);

	// Handle value changes from bits-ui
	function handleValueChange(newValue: string | undefined) {
		const stringValue = newValue ?? '';
		value = stringValue;
		onchange?.(stringValue);
	}

	// Clear search when the dropdown closes
	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			searchTerm = '';
		}
	}

	// Build aria-describedby attribute
	function buildAriaDescribedBy(): string | undefined {
		if (hasError) return `${id}-error`;
		if (helperText) return `${id}-helper`;
		return undefined;
	}
</script>

<div class="ml-combobox-wrapper {className}" class:has-error={hasError}>
	{#if label}
		<label for={id} class="ml-combobox-label">
			{label}
			{#if required}
				<span class="ml-combobox-required">*</span>
			{/if}
		</label>
	{/if}

	<Combobox.Root
		type="single"
		bind:value
		onValueChange={handleValueChange}
		onOpenChange={handleOpenChange}
		{disabled}
		required={required || false}
	>
		<Combobox.Trigger {id} aria-invalid={hasError} aria-describedby={buildAriaDescribedBy()}>
			{#snippet child({ props })}
				<button {...props} class="ml-combobox" type="button">
					<span class="ml-combobox-value">{triggerDisplay}</span>
					<span class="ml-combobox-chevron" aria-hidden="true">▾</span>
				</button>
			{/snippet}
		</Combobox.Trigger>
		<Combobox.Portal>
			<Combobox.Content class="ml-combobox-content">
				<div class="ml-combobox-search">
					<input
						placeholder={searchPlaceholder}
						class="ml-combobox-input"
						value={searchTerm}
						oninput={(e) => {
							searchTerm = (e.target as HTMLInputElement).value;
						}}
					/>
				</div>
				<Combobox.Viewport class="ml-combobox-viewport">
					{#each filteredOptions as option (option.value)}
						<Combobox.Item
							value={option.value}
							label={option.label}
							disabled={option.disabled}
							class="ml-combobox-item"
						>
							{#snippet children({ selected })}
								<span class="ml-combobox-item-label">{option.label}</span>
								{#if selected}
									<span class="ml-combobox-item-indicator">✓</span>
								{/if}
							{/snippet}
						</Combobox.Item>
					{:else}
						<div class="ml-combobox-empty">No results found</div>
					{/each}
				</Combobox.Viewport>
			</Combobox.Content>
		</Combobox.Portal>
	</Combobox.Root>

	{#if hasError && errorMessage}
		<div id="{id}-error" class="ml-combobox-error">{errorMessage}</div>
	{:else if helperText}
		<div id="{id}-helper" class="ml-combobox-helper">{helperText}</div>
	{/if}
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-combobox-wrapper {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		width: 100%;
	}

	.ml-combobox-label {
		font-size: $font-xs;
		font-weight: $font-md;
		color: $text-normal;
		margin-bottom: 0;
		display: flex;
		align-items: center;
		gap: $spacing-xxs;
	}

	.ml-combobox-required {
		color: -error;
		font-weight: bold;
	}

	.ml-combobox {
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

	.ml-combobox-value {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ml-combobox-chevron {
		margin-left: $spacing-xs;
		font-size: $font-xs;
		color: $text-muted;
		flex-shrink: 0;
	}

	.ml-combobox:hover:not([data-disabled]) {
		border-color: $background-modifier-border-hover;
	}

	.ml-combobox[data-state='open'] {
		border-color: $interactive-accent;
		box-shadow: 0 0 0 2px $background-modifier-border-focus;
	}

	.ml-combobox:focus-visible {
		outline: none;
		border-color: $interactive-accent;
		box-shadow: 0 0 0 2px $background-modifier-border-focus;
	}

	.ml-combobox[data-disabled] {
		background-color: $background-secondary;
		color: $text-muted;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.ml-combobox-wrapper.has-error .ml-combobox {
		border-color: -error;
		background-color: color-mix(in srgb, -error 5%, transparent);
	}

	.ml-combobox-wrapper.has-error .ml-combobox:focus-visible {
		box-shadow: 0 0 0 2px color-mix(in srgb, -error 10%, transparent);
	}

	/* Dropdown content styles */
	:global(.ml-combobox-content) {
		background-color: $background-primary;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-input;
		box-shadow: 0 4px 12px color-mix(in srgb, $text-normal 15%, transparent);
		z-index: 50;
		min-width: var(--bits-floating-anchor-width);
	}

	:global(.ml-combobox-search) {
		padding: $spacing-xs;
		border-bottom: 1px solid $background-modifier-border;
	}

	:global(.ml-combobox-input) {
		width: 100%;
		padding: $spacing-xs $spacing-sm;
		font-family: inherit;
		font-size: $font-sm;
		color: $text-normal;
		background-color: $background-primary;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-sm;
		outline: none;
		box-sizing: border-box;
	}

	:global(.ml-combobox-input:focus) {
		border-color: $interactive-accent;
		box-shadow: 0 0 0 2px $background-modifier-border-focus;
	}

	:global(.ml-combobox-input::placeholder) {
		color: $text-muted;
	}

	:global(.ml-combobox-viewport) {
		padding: $spacing-xxs;
		max-height: 300px;
		overflow-y: auto;
	}

	:global(.ml-combobox-item) {
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

	:global(.ml-combobox-item:hover:not([data-disabled])) {
		background-color: $background-modifier-hover;
	}

	:global(.ml-combobox-item[data-selected]) {
		background-color: $background-modifier-active;
	}

	:global(.ml-combobox-item[data-disabled]) {
		color: $text-muted;
		cursor: not-allowed;
		opacity: 0.5;
	}

	:global(.ml-combobox-item-label) {
		flex: 1;
	}

	:global(.ml-combobox-item-indicator) {
		color: $interactive-accent;
		font-weight: bold;
		margin-left: 0.5rem;
	}

	:global(.ml-combobox-empty) {
		padding: $spacing-sm;
		font-size: $font-sm;
		color: $text-muted;
		text-align: center;
	}

	.ml-combobox-error,
	.ml-combobox-helper {
		font-size: $font-xs;
		line-height: 1.4;
	}

	.ml-combobox-error {
		color: -error;
	}

	.ml-combobox-helper {
		color: $text-muted;
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ml-combobox {
			padding: $spacing-xs $spacing-sm;
			font-size: 1rem; /* Prevent iOS zoom */
		}

		:global(.ml-combobox-item) {
			padding: $spacing-sm $spacing-sm;
			font-size: 1rem;
		}
	}
</style>
