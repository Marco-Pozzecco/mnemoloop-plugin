<script lang="ts">
	import { Dashboard, Review } from '@/ui/components';
	import { setAppContext } from '@/ui/context/AppContext';
	import { uiStore } from '@/ui/store/ui.store';
	import type { AppProps } from './types';

	// props
	const { app, component }: AppProps = $props();

	// state
	let currentView = $state(uiStore.currentView);

	// subscription
	uiStore.store.subscribe((state) => {
		currentView = state.currentView;
	});

	// context
	$effect(() => {
		setAppContext({ app, component });
	});
</script>

<div class="ml-app-container">
	{#if currentView === 'dashboard'}
		<Dashboard />
	{:else if currentView === 'review'}
		<Review />
	{/if}
</div>

<style>
	.ml-app-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}
</style>
