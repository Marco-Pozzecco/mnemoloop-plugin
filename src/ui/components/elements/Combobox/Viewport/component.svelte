<script lang="ts">
	import { Combobox } from 'bits-ui';
	import type ComboboxViewportProps from './types';

	let { class: className = '', ...rest }: ComboboxViewportProps = $props();
</script>

<Combobox.Viewport {...rest} class="ml-combobox__viewport {className}" />

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-combobox__viewport) {
		padding: $spacing-xxs;
		max-height: 300px;
		overflow-y: auto;
	}
</style>
