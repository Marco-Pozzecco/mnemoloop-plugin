<script lang="ts">
	import type FormFieldProps from './types';

	let {
		label,
		htmlFor,
		helper,
		error,
		required = false,
		className = '',
		children,
	}: FormFieldProps = $props();
</script>

<div class="ml-form-field {className}">
	{#if label}
		{#if htmlFor}
			<label class="ml-form-field__label" for={htmlFor}>
				{label}
				{#if required}<span class="ml-form-field__required">*</span>{/if}
			</label>
		{:else}
			<span class="ml-form-field__label">
				{label}
				{#if required}<span class="ml-form-field__required">*</span>{/if}
			</span>
		{/if}
	{/if}
	{@render children?.()}
	{#if error}
		<p class="ml-form-field__message ml-form-field__message--error">{error}</p>
	{:else if helper}
		<p class="ml-form-field__message">{helper}</p>
	{/if}
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-form-field {
		display: flex;
		flex-direction: column;
		gap: $spacing-xxs;
	}

	.ml-form-field__label {
		display: flex;
		align-items: center;
		gap: $spacing-xxs;
		font-size: $font-xs;
		font-weight: $font-medium;
		color: $text-normal;
	}

	.ml-form-field__required {
		color: $text-error;
	}

	.ml-form-field__message {
		margin: 0;
		font-size: $font-xs;
		line-height: 1.4;
		color: $text-faint;
	}

	.ml-form-field__message--error {
		color: $text-error;
	}
</style>
