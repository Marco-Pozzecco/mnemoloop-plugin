<script lang="ts">
	import type DashboardHeaderProps from './types';

	export const { className, onRefresh, isLoading } = $props() as DashboardHeaderProps;
</script>

<header class="ml-dashboard__header {className}">
	<div class="ml-dashboard__title-group">
		<h1 class="ml-dashboard__title">Learning dashboard</h1>
		<p class="ml-dashboard__subtitle">Track your progress and stay consistent</p>
	</div>
</header>

<style lang="scss">
	@use 'tokens' as *;

	.ml-dashboard__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: $spacing-md;
	}

	.ml-dashboard__title {
		margin: 0;
		font-size: $font-md;
		font-weight: $font-bold;
		color: $text-normal;
	}

	.ml-dashboard__subtitle {
		margin: $spacing-xxs 0 0 0;
		color: $text-muted;
		font-size: $font-sm;
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ml-dashboard__header {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
