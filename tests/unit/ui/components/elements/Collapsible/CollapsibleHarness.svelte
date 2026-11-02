<script lang="ts">
	import { Collapsible } from '@/ui/components/elements';

	interface HarnessProps {
		initialOpen?: boolean;
		disabled?: boolean;
		hiddenUntilFound?: boolean;
		padding?: 'default' | 'none';
		divided?: boolean;
	}

	let {
		initialOpen = false,
		disabled = false,
		hiddenUntilFound = false,
		padding = 'default',
		divided = true,
	}: HarnessProps = $props();
	// The harness seeds local state once from its initial props.
	// svelte-ignore state_referenced_locally
	let open = $state(initialOpen);
</script>

<Collapsible.Root bind:open {disabled} data-testid="collapsible-root">
	<Collapsible.Trigger aria-label="Toggle details">Details</Collapsible.Trigger>
	<Collapsible.Content {hiddenUntilFound} {padding} {divided}>
		<p>Additional details</p>
	</Collapsible.Content>
</Collapsible.Root>

<output data-testid="open">{open ? 'true' : 'false'}</output>
