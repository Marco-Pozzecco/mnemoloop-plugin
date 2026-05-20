<script lang="ts">
	import { Select } from 'bits-ui';
	import type { SelectProps } from './types';

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
		onchange,
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
			aria-invalid={hasError}
			aria-describedby={buildAriaDescribedBy()}
		>
			{#snippet child({ props })}
				<button {...props} class="ml-select" type="button">
					<Select.Value {placeholder} />
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

<style>
	.ml-select-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}

	.ml-select-label {
		font-size: var(--font-ui-smaller);
		font-weight: var(--font-medium);
		color: var(--text-normal);
		margin-bottom: 0;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.ml-select-required {
		color: var(--text-error);
		font-weight: bold;
	}

	.ml-select {
		width: 100%;
		padding: 0.625rem 0.75rem;
		font-family: inherit;
		font-size: var(--font-ui-small);
		color: var(--text-normal);
		background-color: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--input-radius, 4px);
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
		border-color: var(--background-modifier-border-hover);
	}

	.ml-select[data-state='open'] {
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px var(--background-modifier-border-focus);
	}

	.ml-select:focus-visible {
		outline: none;
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px var(--background-modifier-border-focus);
	}

	.ml-select[data-disabled] {
		background-color: var(--background-secondary);
		color: var(--text-muted);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.ml-select-wrapper.has-error .ml-select {
		border-color: var(--text-error);
		background-color: color-mix(in srgb, var(--text-error) 5%, transparent);
	}

	.ml-select-wrapper.has-error .ml-select:focus-visible {
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--text-error) 10%, transparent);
	}

	/* Dropdown content styles */
	:global(.ml-select-content) {
		background-color: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--input-radius, 4px);
		box-shadow: 0 4px 12px color-mix(in srgb, var(--text-normal) 15%, transparent);
		z-index: 50;
		min-width: var(--bits-select-trigger-width);
	}

	:global(.ml-select-viewport) {
		padding: 0.25rem;
		max-height: 300px;
		overflow-y: auto;
	}

	:global(.ml-select-item) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		font-size: var(--font-ui-small);
		color: var(--text-normal);
		cursor: pointer;
		border-radius: calc(var(--input-radius, 4px) - 2px);
		transition: background-color 0.15s ease;
	}

	:global(.ml-select-item:hover:not([data-disabled])) {
		background-color: var(--background-modifier-hover);
	}

	:global(.ml-select-item[data-selected]) {
		background-color: var(--background-modifier-active);
	}

	:global(.ml-select-item[data-disabled]) {
		color: var(--text-muted);
		cursor: not-allowed;
		opacity: 0.5;
	}

	:global(.ml-select-item-label) {
		flex: 1;
	}

	:global(.ml-select-item-indicator) {
		color: var(--interactive-accent);
		font-weight: bold;
		margin-left: 0.5rem;
	}

	.ml-select-error,
	.ml-select-helper {
		font-size: var(--font-ui-smaller);
		line-height: 1.4;
	}

	.ml-select-error {
		color: var(--text-error);
	}

	.ml-select-helper {
		color: var(--text-muted);
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ml-select {
			padding: 0.5rem 0.625rem;
			font-size: 1rem; /* Prevent iOS zoom */
		}

		:global(.ml-select-item) {
			padding: 0.625rem 0.75rem;
			font-size: 1rem;
		}
	}
</style>
