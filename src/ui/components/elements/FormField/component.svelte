<script lang="ts">
	import type FormFieldProps from './types';

	let { label, className = '', children }: FormFieldProps = $props();
</script>

<div class="ml-form-field {className}">
	{#if label}
		<span class="ml-form-field-label">{label}</span>
	{/if}
	{@render children?.()}
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-form-field {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
	}

	.ml-form-field-label {
		font-size: $font-sm;
		font-weight: $font-medium;
		color: $text-muted;
	}
</style>
