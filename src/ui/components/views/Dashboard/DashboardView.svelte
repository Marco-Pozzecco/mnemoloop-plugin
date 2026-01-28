<script lang="ts">
	import { onMount } from 'svelte';
	import ErrorWrapper from '@/ui/components/atoms/ErrorWrapper/ErrorWrapper.svelte';
	import Dashboard from './Dashboard.svelte';
	import type { DashboardStats, DashboardConfig } from './types';

	interface Props {
		stats: DashboardStats;
		config: DashboardConfig;
		onStartReview?: () => void;
		onRefresh?: () => void;
		onOpenSettings?: () => void;
		onConfigChange?: (config: Partial<DashboardConfig>) => void;
		statsLoader: () => Promise<DashboardStats>;
	}

	let {
		stats,
		config,
		onStartReview,
		onRefresh,
		onOpenSettings,
		onConfigChange,
		statsLoader,
	}: Props = $props();

	let isLoading = $state(false);

	async function handleRefreshWithRetry(): Promise<void> {
		if (isLoading) return;

		isLoading = true;
		try {
			await onRefresh?.();
			// Stats will be updated via prop binding
		} finally {
			isLoading = false;
		}
	}

	// Initial stats load
	onMount(async () => {
		await handleRefreshWithRetry();
	});
</script>

<ErrorWrapper
	fallback="Unable to load dashboard statistics"
	onRetry={handleRefreshWithRetry}
	showError={true}
	maxRetries={3}
	errorContext="DashboardView"
>
	<Dashboard
		{stats}
		{config}
		{onStartReview}
		onRefresh={handleRefreshWithRetry}
		{onOpenSettings}
		{onConfigChange}
	/>
</ErrorWrapper>
