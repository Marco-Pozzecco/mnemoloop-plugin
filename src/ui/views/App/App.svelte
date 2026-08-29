<script lang="ts">
	import { Priming } from '@/ui/components/views';
	import { Banner, Dashboard, Review } from '@/ui/components';
	import { Analytics, Manage } from '@/ui/components/views';
	import { Navbar } from '@/ui/components/sections';
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

	// context — set synchronously during init; props ($props) are inherently reactive
	setAppContext({ app, component });
</script>

<div class="ml-app-container">
	{#if $bannerRef.activeBanner}
		<Banner
			banner={$bannerRef.activeBanner}
			onDismiss={() => bannerStore.dismiss($bannerRef.activeBanner!.id)}
		/>
	{/if}
	{#if currentView !== 'review' && currentView !== 'priming'}
		<Navbar bind:activeTab={currentView} />
	{/if}
	<div class="ml-app-view-section">
		{#if currentView === 'review'}
			<Review />
		{:else if currentView === 'priming'}
			<Priming />
		{:else if currentView === 'dashboard'}
			<Dashboard />
		{:else if currentView === 'manage'}
			<Manage />
		{:else}
			<Analytics />
		{/if}
	</div>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-app-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow-y: hidden;
	}

	.ml-app-view-section {
		width: 100%;
		overflow-y: auto;
	}

	@media (max-width: 480px) {
		.ml-app-container {
			padding-bottom: calc($navbar-bottom-offset + $navbar-height + $spacing-md);
		}
	}
</style>
