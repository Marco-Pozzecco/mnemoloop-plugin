<script lang="ts">
	import type ComboboxEmptyProps from './types';

	let { class: className = '', children }: ComboboxEmptyProps = $props();
</script>

<div class="ml-combobox__empty {className}">
	{@render children?.()}
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-combobox__empty {
		padding: $spacing-sm $spacing-sm;
		font-size: $font-sm;
		color: $text-muted;
		text-align: center;
	}
</style>
