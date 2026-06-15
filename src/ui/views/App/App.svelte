<script lang="ts">
	import { Banner, Dashboard, Review } from '@/ui/components';
	import { setAppContext } from '@/ui/context/AppContext';
	import { uiStore } from '@/ui/store/ui.store';
	import type { AppProps } from './types';
	import { bannerStore } from '@/ui/store/banner.store';

	// props
	const { app, component }: AppProps = $props();

	// state
	let currentView = $state(uiStore.currentView);
	const bannerRef = bannerStore.store;

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
	{#if $bannerRef.activeBanner}
		<Banner
			banner={$bannerRef.activeBanner}
			onDismiss={() => bannerStore.dismiss($bannerRef.activeBanner!.id)}
		/>
	{/if}
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
		overflow-y: auto;
	}
</style>
