<script lang="ts">
	import type SelectProps from './types';

	let {
		id = `ka-select-${Math.random().toString(36).substring(2, 9)}`,
		label,
		options,
		value = '',
		placeholder = '',
		disabled = false,
		required = false,
		hasError = false,
		errorMessage = '',
		helperText,
		className = '',
		onchange,
	}: SelectProps = $props();

	let selectElement: HTMLSelectElement;

	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newValue = target.value;
		value = newValue;
		if (onchange) {
			onchange(newValue);
		}
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

	<select
		bind:this={selectElement}
		{id}
		{value}
		{disabled}
		{required}
		class="ka-select"
		aria-invalid={hasError}
		aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
		onchange={handleChange}
	>
		{#if placeholder}
			<option value="" disabled selected={!value}>{placeholder}</option>
		{/if}
		{#each options as option (option.value)}
			<option value={option.value} disabled={option.disabled}>
				{option.label}
			</option>
		{/each}
	</select>

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

	.ka-select {
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
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		padding-right: 2rem;
	}

	.ka-select:hover:not(:disabled):not(:focus) {
		border-color: var(--background-modifier-border-hover);
	}

	.ka-select:focus {
		outline: none;
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px var(--background-modifier-border-focus);
	}

	.ka-select:disabled {
		background-color: var(--background-secondary);
		color: var(--text-muted);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.ka-select-wrapper.has-error .ka-select {
		border-color: var(--text-error);
		background-color: rgba(255, 0, 0, 0.05);
	}

	.ka-select-wrapper.has-error .ka-select:focus {
		box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.1);
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
		.ka-select {
			padding: 0.5rem 0.625rem;
			padding-right: 2rem;
			font-size: 1rem; /* Prevent iOS zoom */
		}
	}
</style>
