<script lang="ts">
	import Icon from '../../Icon/component.svelte';
	import type ComboboxItemIndicatorProps from './types';

	let { class: className = '' }: ComboboxItemIndicatorProps = $props();
</script>

<span class="ml-combobox__item-indicator {className}">
	<Icon name="check" size={14} />
</span>

<style lang="scss">
	@use 'tokens' as *;

	.ml-combobox__item-indicator {
		display: inline-flex;
		align-items: center;
		color: $interactive-accent;
		flex: 0 0 auto;
	}
</style>
