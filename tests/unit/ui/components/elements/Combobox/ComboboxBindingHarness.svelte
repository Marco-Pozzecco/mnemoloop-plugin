<script lang="ts">
	import { Combobox } from '@/ui/components/elements';

	let { initialValue = [] }: { initialValue?: string[] } = $props();
	let selected = $state(initialValue);
	const options = [
		{ value: 'math', label: 'Math' },
		{ value: 'language', label: 'Language' },
	];
</script>

<Combobox.Root type="multiple" bind:value={selected} items={options}>
	<Combobox.Trigger />
	<Combobox.Portal>
		<Combobox.Content>
			<Combobox.Input aria-label="Search options" />
			<Combobox.Viewport>
				{#each options as option (option.value)}
					<Combobox.Item value={option.value} label={option.label} />
				{/each}
			</Combobox.Viewport>
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>

<output data-testid="selected">{selected.join(',')}</output>
