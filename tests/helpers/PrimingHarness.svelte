<script lang="ts">
	import type { App, Component } from 'obsidian';
	import { setAppContext } from '@/ui/context/AppContext';
	import Priming from '@/ui/components/views/Priming/component.svelte';

	interface Props {
		app: App;
		component: Component;
	}

	let { app, component }: Props = $props();

	setAppContext({ app, component });
</script>

<Priming />
