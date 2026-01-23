<script lang="ts">
	import { onMount } from 'svelte';
	import ErrorWrapper from '../../components/common/ErrorWrapper.svelte';
	import Dashboard from './Dashboard.svelte';
	import type { DashboardStats, DashboardConfig } from './types';

	interface Props {
		app: any;
		stats: DashboardStats;
		config: DashboardConfig;
		onStartReview?: () => void;
		onRefresh?: () => void;
		onOpenSettings?: () => void;
		onConfigChange?: (config: Partial<DashboardConfig>) => void;
		statsLoader: () => Promise<DashboardStats>;
	}

	let {
		app,
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
		{app}
		{stats}
		{config}
		onStartReview={onStartReview}
		onRefresh={handleRefreshWithRetry}
		onOpenSettings={onOpenSettings}
		onConfigChange={onConfigChange}
	/>
</ErrorWrapper>
