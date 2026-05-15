<script lang="ts">
	import type DashboardHeaderProps from './types';

	export const { className, onRefresh, isLoading } = $props() as DashboardHeaderProps;
</script>

<header class="ml-dashboard__header {className}">
	<div class="ml-dashboard__title-group">
		<h1 class="ml-dashboard__title">Learning Dashboard</h1>
		<p class="ml-dashboard__subtitle">Track your progress and stay consistent</p>
	</div>
</header>

<style>
	.ml-dashboard__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
	}

	.ml-dashboard__title {
		margin: 0;
		font-size: var(--font-l);
		font-weight: var(--font-bold);
		color: var(--text-normal);
	}

	.ml-dashboard__subtitle {
		margin: 4px 0 0 0;
		color: var(--text-muted);
		font-size: var(--font-ui-small);
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ml-dashboard__header {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
