<script lang="ts">
	import { Collapsible } from '@/ui/components/elements';

	interface HarnessProps {
		initialOpen?: boolean;
		disabled?: boolean;
		hiddenUntilFound?: boolean;
	}

	let {
		initialOpen = false,
		disabled = false,
		hiddenUntilFound = false,
	}: HarnessProps = $props();
	let open = $state(initialOpen);
</script>

<Collapsible.Root bind:open {disabled} data-testid="collapsible-root">
	<Collapsible.Trigger aria-label="Toggle details">Details</Collapsible.Trigger>
	<Collapsible.Content {hiddenUntilFound}>
		<p>Additional details</p>
	</Collapsible.Content>
</Collapsible.Root>

<output data-testid="open">{open ? 'true' : 'false'}</output>
