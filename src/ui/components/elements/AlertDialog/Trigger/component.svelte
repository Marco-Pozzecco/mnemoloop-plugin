<script lang="ts">
	import { AlertDialog } from 'bits-ui';
	import type AlertDialogTriggerProps from './types';

	let { class: className = '', children, ...rest }: AlertDialogTriggerProps = $props();
</script>

<AlertDialog.Trigger {...rest} class={className}>
	{@render children?.()}
</AlertDialog.Trigger>
