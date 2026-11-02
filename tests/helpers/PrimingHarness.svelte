<script lang="ts">
	import type { App, Component } from 'obsidian';
	import { setAppContext } from '@/ui/context/AppContext';
	import Priming from '@/ui/components/views/Priming/component.svelte';

	interface Props {
		app: App;
		component: Component;
	}

	let { app, component }: Props = $props();

	// The harness mounts once with fixed props.
	// svelte-ignore state_referenced_locally
	setAppContext({ app, component });
</script>

<Priming />
