<script lang="ts">
	import { Banner, Dashboard, Review } from '@/ui/components';
	import { Navbar } from '@/ui/components/sections';
	import { setAppContext } from '@/ui/context/AppContext';
	import { uiStore } from '@/ui/store/ui.store';
	import type { AppProps } from './types';
	import { bannerStore } from '@/ui/store/banner.store';

	// props
	const { app, component }: AppProps = $props();

	// state
	let currentView = $state(uiStore.currentView);
	let activeTab = $state<'dashboard' | 'analytics'>('dashboard');
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
	{#if currentView === 'review'}
		<Review />
	{:else}
		<Navbar bind:activeTab />
		{#if activeTab === 'dashboard'}
			<Dashboard />
		{/if}
	{/if}
</div>

<style>
	.ml-app-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow-y: auto;
	}

	@media (max-width: 480px) {
		.ml-app-container {
			padding-bottom: calc(60px + env(safe-area-inset-bottom, 0));
		}
	}
</style>
