<script lang="ts">
	import Button from '@/ui/components/elements/Button/component.svelte';
	import Icon from '@/ui/components/elements/Icon/component.svelte';
	import type DangerZoneProps from './types';

	let { onReset, isLoading = false }: DangerZoneProps = $props();

	async function handleReset() {
		await onReset();
	}
</script>

<section class="ml-danger-zone">
	<div class="ml-danger-zone__header">
		<Icon name="alert-triangle" size={20} color="var(--text-error)" />
		<h2 class="ml-danger-zone__title">Danger Zone</h2>
	</div>

	<p class="ml-danger-zone__description">
		Warning: Actions in this section are destructive and cannot be undone. Please proceed with
		caution.
	</p>

	<div class="ml-danger-zone__content">
		<div class="ml-danger-zone__action">
			<div class="ml-danger-zone__action-info">
				<span class="ml-danger-zone__action-label">Reset Settings</span>
				<span class="ml-danger-zone__action-helper">
					This will revert all settings to their default values
				</span>
			</div>
			<Button
				variant="danger"
				onclick={handleReset}
				disabled={isLoading}
				title="Reset all settings to defaults"
			>
				{#if isLoading}
					<span class="ml-danger-zone__loading">Resetting...</span>
				{:else}
					Reset to Defaults
				{/if}
			</Button>
		</div>
	</div>
</section>

<style>
	.ml-danger-zone {
		border: 1px solid var(--text-error);
		border-radius: var(--radius-m);
		background-color: rgba(var(--text-error-rgb, 255, 0, 0), 0.05);
		padding: var(--size-4-3);
	}

	.ml-danger-zone__header {
		display: flex;
		align-items: center;
		gap: var(--size-2-2);
		margin-bottom: var(--size-4-2);
	}

	.ml-danger-zone__title {
		font-size: var(--font-ui-medium);
		font-weight: var(--font-semibold);
		color: var(--text-error);
		margin: 0;
	}

	.ml-danger-zone__description {
		font-size: var(--font-ui-small);
		color: var(--text-muted);
		margin: 0 0 var(--size-4-3) 0;
		line-height: var(--line-height-normal);
	}

	.ml-danger-zone__content {
		display: flex;
		flex-direction: column;
		gap: var(--size-4-2);
	}

	.ml-danger-zone__action {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--size-4-3);
		padding-top: var(--size-4-2);
		border-top: 1px solid rgba(var(--text-error-rgb, 255, 0, 0), 0.2);
	}

	.ml-danger-zone__action-info {
		display: flex;
		flex-direction: column;
		gap: var(--size-2-1);
	}

	.ml-danger-zone__action-label {
		font-size: var(--font-ui-small);
		font-weight: var(--font-medium);
		color: var(--text-normal);
	}

	.ml-danger-zone__action-helper {
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
	}

	.ml-danger-zone__loading {
		display: inline-flex;
		align-items: center;
		gap: var(--size-2-2);
	}

	/* Mobile-first responsive adjustments */
	@media (max-width: 480px) {
		.ml-danger-zone__action {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--size-4-2);
		}
	}
</style>
