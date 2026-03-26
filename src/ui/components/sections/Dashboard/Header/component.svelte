<script lang="ts">
	import { Button, Icon } from '@/ui/components';
	import type { DashboardHeaderProps } from './types';

	export const { className, onRefresh, isLoading } = $props() as DashboardHeaderProps;

	function handleRefresh() {
		onRefresh();
	}
</script>

<header class="ka-dashboard__header {className}">
	<div class="ka-dashboard__title-group">
		<h1 class="ka-dashboard__title">Learning Dashboard</h1>
		<p class="ka-dashboard__subtitle">Track your progress and stay consistent</p>
	</div>
	<div class="ka-dashboard__actions">
		<Button
			variant="secondary"
			size="small"
			onclick={handleRefresh}
			disabled={isLoading}
			title="Refresh statistics"
		>
			<Icon name="refresh-cw" size={16} />
		</Button>
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

	.ka-dashboard__actions {
		display: flex;
		gap: 8px;
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ka-dashboard__header {
			flex-direction: column;
			align-items: stretch;
		}

		.ka-dashboard__actions {
			justify-content: flex-end;
		}
	}
</style>
