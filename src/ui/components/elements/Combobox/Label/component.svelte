<script lang="ts">
	import type ComboboxLabelProps from './types';

	let { for: htmlFor, class: className = '', children }: ComboboxLabelProps = $props();
</script>

<label class="ml-combobox__label {className}" for={htmlFor}>
	{@render children?.()}
</label>

<style lang="scss">
	@use 'tokens' as *;

	.ml-combobox__label {
		font-size: $font-xs;
		font-weight: $font-md;
		color: $text-normal;
		margin-bottom: 0;
	}
</style>
