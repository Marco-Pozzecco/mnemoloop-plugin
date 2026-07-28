<script lang="ts">
	import type TextareaProps from './types';

	let {
		id = `ml-textarea-${Math.random().toString(36).substring(2, 9)}`,
		label,
		placeholder = '',
		value = '',
		disabled = false,
		required = false,
		hasError = false,
		errorMessage = '',
		helperText,
		rows = 5,
		maxLength,
		className = '',
		onchange,
		onfocus,
		onblur,
	}: TextareaProps = $props();

	function handleChange(event: Event) {
		const target = event.target as HTMLTextAreaElement;
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
</script>

<div class="ml-textarea-wrapper {className}" class:has-error={hasError}>
	{#if label}
		<label for={id} class="ml-textarea-label">
			{label}
			{#if required}
				<span class="ml-textarea-required">*</span>
			{/if}
		</label>
	{/if}

	<textarea
		{id}
		{placeholder}
		{value}
		{disabled}
		{required}
		{rows}
		maxlength={maxLength}
		aria-invalid={hasError}
		aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
		class="ml-textarea"
		onchange={handleChange}
		onfocus={handleFocus}
		{onblur}
	></textarea>

	{#if hasError && errorMessage}
		<div id="{id}-error" class="ml-textarea-error">{errorMessage}</div>
	{:else if helperText}
		<div id="{id}-helper" class="ml-textarea-helper">{helperText}</div>
	{/if}
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-textarea-wrapper {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
	}

	.ml-textarea-label {
		font-size: $font-xs;
		font-weight: $font-md;
		color: $text-normal;
		margin-bottom: 0;
		display: flex;
		align-items: center;
		gap: $spacing-xxs;
	}

	.ml-textarea-required {
		color: -error;
		font-weight: bold;
	}

	.ml-textarea {
		width: 100%;
		min-height: 100px;
		padding: $spacing-sm $spacing-sm;
		font-family: inherit;
		font-size: $font-sm;
		color: $text-normal;
		background-color: $background-primary;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-input;
		resize: vertical;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.ml-textarea::placeholder {
		color: $text-muted;
	}

	.ml-textarea:hover:not(:disabled):not(:focus) {
		border-color: $background-modifier-border-hover;
	}

	.ml-textarea:focus {
		outline: none;
		border-color: $interactive-accent;
		box-shadow: 0 0 0 2px $background-modifier-border-focus;
	}

	.ml-textarea:disabled {
		background-color: $background-secondary;
		color: $text-muted;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.ml-textarea-wrapper.has-error .ml-textarea {
		border-color: -error;
		background-color: color-mix(in srgb, -error 5%, transparent);
	}

	.ml-textarea-wrapper.has-error .ml-textarea:focus {
		box-shadow: 0 0 0 2px color-mix(in srgb, -error 10%, transparent);
	}

	.ml-textarea-error,
	.ml-textarea-helper {
		font-size: $font-xs;
		line-height: 1.4;
	}

	.ml-textarea-error {
		color: -error;
	}

	.ml-textarea-helper {
		color: $text-muted;
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ml-textarea {
			padding: $spacing-xs $spacing-sm;
			font-size: 1rem; /* Prevent iOS zoom */
		}
	}
</style>
