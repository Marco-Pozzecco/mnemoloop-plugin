<script lang="ts">
	import { Combobox } from '@/ui/components/elements';

	let customAnchor = $state<HTMLDivElement | null>(null);
	const options = [{ value: 'math', label: 'Math' }];
</script>

<Combobox.Root type="multiple" items={options}>
	<div bind:this={customAnchor} data-testid="custom-anchor"></div>
	<Combobox.Trigger />
	<Combobox.Portal>
		<Combobox.Content customAnchor={customAnchor}>
			<Combobox.Input aria-label="Search options" />
			<Combobox.Viewport>
				{#each options as option (option.value)}
					<Combobox.Item value={option.value} label={option.label} />
				{/each}
			</Combobox.Viewport>
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>
