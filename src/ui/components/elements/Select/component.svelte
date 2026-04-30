<script lang="ts">
	import { Select } from 'bits-ui';
	import type { SelectProps } from './types';

	let {
		id = `ka-select-${Math.random().toString(36).substring(2, 9)}`,
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

<div class="ka-select-wrapper {className}" class:has-error={hasError}>
	{#if label}
		<label for={id} class="ka-select-label">
			{label}
			{#if required}
				<span class="ka-select-required">*</span>
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
			class="ka-select"
			aria-invalid={hasError}
			aria-describedby={buildAriaDescribedBy()}
		>
			{#snippet child({ props })}
				<button {...props} type="button">
					<Select.Value {placeholder} />
				</button>
			{/snippet}
		</Select.Trigger>
		<Select.Portal>
			<Select.Content class="ka-select-content">
				<Select.Viewport class="ka-select-viewport">
					{#each options as option (option.value)}
						<Select.Item value={option.value} disabled={option.disabled} class="ka-select-item">
							{#snippet children({ selected })}
								<span class="ka-select-item-label">{option.label}</span>
								{#if selected}
									<span class="ka-select-item-indicator">✓</span>
								{/if}
							{/snippet}
						</Select.Item>
					{/each}
				</Select.Viewport>
			</Select.Content>
		</Select.Portal>
	</Select.Root>

	{#if hasError && errorMessage}
		<div id="{id}-error" class="ka-select-error">{errorMessage}</div>
	{:else if helperText}
		<div id="{id}-helper" class="ka-select-helper">{helperText}</div>
	{/if}
</div>

<style>
	.ka-select-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.ka-select-label {
		font-size: var(--font-ui-smaller);
		font-weight: var(--font-medium);
		color: var(--text-normal);
		margin-bottom: 0;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.ka-select-required {
		color: var(--text-error);
		font-weight: bold;
	}

	:global(.ka-select) {
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

	:global(.ka-select:hover:not([data-disabled])) {
		border-color: var(--background-modifier-border-hover);
	}

	:global(.ka-select[data-state='open']) {
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px var(--background-modifier-border-focus);
	}

	:global(.ka-select:focus-visible) {
		outline: none;
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px var(--background-modifier-border-focus);
	}

	:global(.ka-select[data-disabled]) {
		background-color: var(--background-secondary);
		color: var(--text-muted);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.ka-select-wrapper.has-error :global(.ka-select) {
		border-color: var(--text-error);
		background-color: rgba(255, 0, 0, 0.05);
	}

	.ka-select-wrapper.has-error :global(.ka-select:focus-visible) {
		box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.1);
	}

	/* Dropdown content styles */
	:global(.ka-select-content) {
		background-color: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--input-radius, 4px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 50;
		min-width: var(--bits-select-trigger-width);
	}

	:global(.ka-select-viewport) {
		padding: 0.25rem;
		max-height: 300px;
		overflow-y: auto;
	}

	:global(.ka-select-item) {
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

	:global(.ka-select-item:hover:not([data-disabled])) {
		background-color: var(--background-modifier-hover);
	}

	:global(.ka-select-item[data-selected]) {
		background-color: var(--background-modifier-active);
	}

	:global(.ka-select-item[data-disabled]) {
		color: var(--text-muted);
		cursor: not-allowed;
		opacity: 0.5;
	}

	:global(.ka-select-item-label) {
		flex: 1;
	}

	:global(.ka-select-item-indicator) {
		color: var(--interactive-accent);
		font-weight: bold;
		margin-left: 0.5rem;
	}

	.ka-select-error,
	.ka-select-helper {
		font-size: var(--font-ui-smaller);
		line-height: 1.4;
	}

	.ka-select-error {
		color: var(--text-error);
	}

	.ka-select-helper {
		color: var(--text-muted);
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		:global(.ka-select) {
			padding: 0.5rem 0.625rem;
			font-size: 1rem; /* Prevent iOS zoom */
		}

		:global(.ka-select-item) {
			padding: 0.625rem 0.75rem;
			font-size: 1rem;
		}
	}
</style>
