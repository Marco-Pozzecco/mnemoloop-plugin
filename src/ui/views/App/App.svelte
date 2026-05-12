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

<div class="app-container">
	{#if currentView === 'dashboard'}
		<Dashboard />
	{:else if currentView === 'review'}
		<Review />
	{/if}
</div>

<style>
	.app-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 1rem;
		color: var(--text-muted);
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--background-modifier-border);
		border-top-color: var(--interactive-accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
