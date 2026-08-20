<script lang="ts">
	import type ComboboxItemLabelProps from './types';

	let { class: className = '', children }: ComboboxItemLabelProps = $props();
</script>

<span class="ml-combobox__item-label {className}">
	{@render children?.()}
</span>

<style lang="scss">
	@use 'tokens' as *;

	.ml-combobox__item-label {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
