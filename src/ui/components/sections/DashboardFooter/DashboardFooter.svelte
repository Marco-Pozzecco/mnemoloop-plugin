<script lang="ts">
	import { Button, Icon } from '@/ui/components';
	import type { DashboardFooterProps } from './DashboardFooter.types';

	let {
		stats,
		onStartReview,
		isDisabled = false,
		isLoading = false,
		className,
	}: DashboardFooterProps = $props();

	let hasDueCards = $derived(stats.dueCount > 0);
</script>

<div class="ka-dashboard__footer-actions {className}">
	<Button
		variant="primary"
		size="large"
		className="ka-start-button"
		disabled={isDisabled}
		onclick={onStartReview}
	>
		{#if isLoading}
			<Icon name="loader-2" className="ka-spin" size={20} />
			<span>Loading...</span>
		{:else if hasDueCards}
			<Icon name="play" size={20} />
			<span>Start Review Session</span>
		{:else}
			<Icon name="check-circle" size={20} />
			<span>All Caught Up!</span>
		{/if}
	</Button>
</div>

<style>
	.ka-dashboard__footer-actions {
		margin-top: 8px;
		display: flex;
		justify-content: center;
	}

	:global(.ka-start-button) {
		width: 100%;
		max-width: 400px;
		gap: 12px;
	}

	:global(.ka-spin) {
		animation: ka-spin 1s linear infinite;
	}

	@keyframes ka-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
