<script lang="ts">
	import type InputProps from './types';

	let {
		id = `ml-input-${Math.random().toString(36).substring(2, 9)}`,
		type = 'text',
		label,
		placeholder = '',
		value = '',
		disabled = false,
		required = false,
		hasError = false,
		errorMessage = '',
		helperText,
		maxLength,
		min,
		max,
		className = '',
		onchange,
		onfocus,
		onblur,
		onkeydown,
	}: InputProps = $props();

	let inputElement: HTMLInputElement;

	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newValue = target.value;
		value = newValue;
		if (onchange) {
			onchange(newValue);
		}
	}

	function handleFocus() {
		if (onfocus) {
			onfocus();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			inputElement?.blur();
		}
		if (onkeydown) {
			onkeydown(event);
		}
	}
</script>

<div class="ml-input-wrapper {className}" class:has-error={hasError}>
	{#if label}
		<label for={id} class="ml-input-label">
			{label}
			{#if required}
				<span class="ml-input-required">*</span>
			{/if}
		</label>
	{/if}

	<input
		bind:this={inputElement}
		{id}
		{type}
		{placeholder}
		{value}
		{disabled}
		{required}
		maxlength={maxLength}
		{min}
		{max}
		aria-invalid={hasError}
		aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
		class="ml-input"
		onchange={handleChange}
		onfocus={handleFocus}
		{onblur}
		onkeydown={handleKeydown}
	/>

	{#if hasError && errorMessage}
		<div id="{id}-error" class="ml-input-error">{errorMessage}</div>
	{:else if helperText}
		<div id="{id}-helper" class="ml-input-helper">{helperText}</div>
	{/if}
</div>

<style>
	.ml-input-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.ml-input-label {
		font-size: var(--font-ui-smaller);
		font-weight: var(--font-medium);
		color: var(--text-normal);
		margin-bottom: 0;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.ml-input-required {
		color: var(--text-error);
		font-weight: bold;
	}

	.ml-input {
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
	}

	.ml-input::placeholder {
		color: var(--text-muted);
	}

	.ml-input:hover:not(:disabled):not(:focus) {
		border-color: var(--background-modifier-border-hover);
	}

	.ml-input:focus {
		outline: none;
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px var(--background-modifier-border-focus);
	}

	.ml-input:disabled {
		background-color: var(--background-secondary);
		color: var(--text-muted);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.ml-input-wrapper.has-error .ml-input {
		border-color: var(--text-error);
		background-color: color-mix(in srgb, var(--text-error) 5%, transparent);
	}

	.ml-input-wrapper.has-error .ml-input:focus {
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--text-error) 10%, transparent);
	}

	.ml-input-error,
	.ml-input-helper {
		font-size: var(--font-ui-smaller);
		line-height: 1.4;
	}

	.ml-input-error {
		color: var(--text-error);
	}

	.ml-input-helper {
		color: var(--text-muted);
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ml-input {
			padding: 0.5rem 0.625rem;
			font-size: 1rem; /* Prevent iOS zoom */
		}
	}
</style>
