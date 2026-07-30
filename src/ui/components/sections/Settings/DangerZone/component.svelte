<script lang="ts">
	import Button from '@/ui/components/elements/Button/component.svelte';
	import Icon from '@/ui/components/elements/Icon/component.svelte';
	import type DangerZoneProps from './types';
	import { tokens } from '@/utils/token';

	let { onReset, isLoading = false }: DangerZoneProps = $props();

	async function handleReset() {
		await onReset();
	}
</script>

<section class="ml-danger-zone">
	<div class="ml-danger-zone__header">
		<Icon name="alert-triangle" size={20} color={tokens['text-error']} />
		<h2 class="ml-danger-zone__title">Danger zone</h2>
	</div>

	<p class="ml-danger-zone__description">
		Warning: Actions in this section are destructive and cannot be undone. Please proceed with
		caution.
	</p>

	<div class="ml-danger-zone__content">
		<div class="ml-danger-zone__action">
			<div class="ml-danger-zone__action-info">
				<span class="ml-danger-zone__action-label">Reset to defaults</span>
				<span class="ml-danger-zone__action-helper">
					This will revert all settings to their default values
				</span>
			</div>
			<Button variant="danger" onclick={handleReset} disabled={isLoading}>
				{#if isLoading}
					<span class="ml-danger-zone__loading">Resetting...</span>
				{:else}
					Reset to defaults
				{/if}
			</Button>
		</div>
	</div>
</section>

<style lang="scss">
	@use 'tokens' as *;

	.ml-danger-zone {
		border: 1px solid -error;
		border-radius: $radius-md;
		background-color: color-mix(in srgb, $background-modifier-error 20%, transparent);
		padding: $spacing-sm;
	}

	.ml-danger-zone__header {
		display: flex;
		align-items: center;
		gap: $spacing-xxs;
		margin-bottom: $spacing-sm;
	}

	.ml-danger-zone__title {
		font-size: $font-md;
		font-weight: $font-semibold;
		color: $text-error;
		margin: 0;
	}

	.ml-danger-zone__description {
		font-size: $font-sm;
		color: $text-muted;
		margin: 0 0 $spacing-sm 0;
		line-height: $line-height-normal;
	}

	.ml-danger-zone__content {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
	}

	.ml-danger-zone__action {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $spacing-sm;
		padding-top: $spacing-sm;
		border-top: 1px solid color-mix(in srgb, $background-modifier-error 30%, transparent);
	}

	.ml-danger-zone__action-info {
		display: flex;
		flex-direction: column;
		gap: $spacing-xxs;
	}

	.ml-danger-zone__action-label {
		font-size: $font-sm;
		font-weight: $font-md;
		color: $text-normal;
	}

	.ml-danger-zone__action-helper {
		font-size: $font-xs;
		color: $text-muted;
	}

	.ml-danger-zone__loading {
		display: inline-flex;
		align-items: center;
		gap: $spacing-xxs;
	}

	/* Mobile-first responsive adjustments */
	@media (max-width: 480px) {
		.ml-danger-zone__action {
			flex-direction: column;
			align-items: flex-start;
			gap: $spacing-sm;
		}
	}
</style>
