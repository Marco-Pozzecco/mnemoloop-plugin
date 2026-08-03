<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import type TooltipTriggerProps from './types';

	let { class: className = '', ...rest }: TooltipTriggerProps = $props();
</script>

<Tooltip.Trigger {...rest} class="ml-tooltip__trigger {className}" />
