<script lang="ts">
	import type { InputProps } from './Input.types';

	let {
		id = `ka-input-${Math.random().toString(36).substr(2, 9)}`,
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
		const newValue = type === 'number' ? Number(target.value) : target.value;
		value = newValue;
		if (onchange) {
			onchange(newValue as string);
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

<div class="ka-input-wrapper {className}" class:has-error={hasError}>
	{#if label}
		<label for={id} class="ka-input-label">
			{label}
			{#if required}
				<span class="ka-input-required">*</span>
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
		class="ka-input"
		onchange={handleChange}
		onfocus={handleFocus}
		onblur={onblur}
		onkeydown={handleKeydown}
	/>

	{#if hasError && errorMessage}
		<div id="{id}-error" class="ka-input-error">{errorMessage}</div>
	{:else if helperText}
		<div id="{id}-helper" class="ka-input-helper">{helperText}</div>
	{/if}
</div>

<style>
	.ka-input-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.ka-input-label {
		font-size: var(--font-ui-smaller);
		font-weight: var(--font-medium);
		color: var(--text-normal);
		margin-bottom: 0;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.ka-input-required {
		color: var(--text-error);
		font-weight: bold;
	}

	.ka-input {
		width: 100%;
		padding: 0.625rem 0.75rem;
		font-family: inherit;
		font-size: var(--font-ui-small);
		color: var(--text-normal);
		background-color: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--input-radius, 4px);
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
		min-height: 44px;
	}

	.ka-input::placeholder {
		color: var(--text-muted);
	}

	.ka-input:hover:not(:disabled):not(:focus) {
		border-color: var(--background-modifier-border-hover);
	}

	.ka-input:focus {
		outline: none;
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px var(--background-modifier-border-focus);
	}

	.ka-input:disabled {
		background-color: var(--background-secondary);
		color: var(--text-muted);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.ka-input-wrapper.has-error .ka-input {
		border-color: var(--text-error);
		background-color: rgba(255, 0, 0, 0.05);
	}

	.ka-input-wrapper.has-error .ka-input:focus {
		box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.1);
	}

	.ka-input-error,
	.ka-input-helper {
		font-size: var(--font-ui-smaller);
		line-height: 1.4;
	}

	.ka-input-error {
		color: var(--text-error);
	}

	.ka-input-helper {
		color: var(--text-muted);
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ka-input {
			padding: 0.5rem 0.625rem;
			font-size: 1rem; /* Prevent iOS zoom */
		}
	}
</style>
