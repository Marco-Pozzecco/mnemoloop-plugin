<script lang="ts">
	import type DashboardHeaderProps from './types';

	export const { className, onRefresh, isLoading } = $props() as DashboardHeaderProps;
</script>

<header class="ka-dashboard__header {className}">
	<div class="ka-dashboard__title-group">
		<h1 class="ka-dashboard__title">Learning Dashboard</h1>
		<p class="ka-dashboard__subtitle">Track your progress and stay consistent</p>
	</div>
</header>

<style>
	.ka-dashboard__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
	}

	.ka-dashboard__title {
		margin: 0;
		font-size: var(--font-l);
		font-weight: var(--font-bold);
		color: var(--text-normal);
	}

	.ka-dashboard__subtitle {
		margin: 4px 0 0 0;
		color: var(--text-muted);
		font-size: var(--font-ui-small);
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ka-dashboard__header {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
