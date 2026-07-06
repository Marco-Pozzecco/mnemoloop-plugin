<script lang="ts">
	import { Button, Icon } from '@/ui/components';
	import type { BannerConfig } from './types';

	let { banner, onDismiss }: { banner: BannerConfig; onDismiss: () => void } = $props();
</script>

<div class="ml-banner" role="banner">
	<div class="ml-banner__content">
		{#if banner.icon}
			<span class="ml-banner__icon">
				<Icon name={banner.icon} size={18} />
			</span>
		{/if}
		<span class="ml-banner__message">{banner.message}</span>
		{#if banner.link}
			<Button
				type="button"
				variant="primary"
				size="small"
				onclick={() => window.open(banner.link!.url, '_blank')}
			>
				{banner.link.label}
			</Button>
		{/if}
	</div>
	<div class="ml-banner__close">
		<Button type="button" variant="icon" size="small" onclick={onDismiss}>
			<Icon name="x" size={14} />
		</Button>
	</div>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-banner {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $spacing-sm;
		padding: $spacing-sm $spacing-md;
		background-color: $background-secondary;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-md;
		color: $text-normal;
		font-size: $font-sm;
		animation: ml-banner-slide-in 0.3s ease-out;
		width: 100%;
	}

	.ml-banner__content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $spacing-md;
		min-width: fit-content;
	}

	.ml-banner__icon {
		flex-shrink: 0;
		color: $interactive-accent;
		display: flex;
		align-items: center;
	}

	.ml-banner__message {
		flex: 1;
		min-width: 0;
		line-height: 1.4;
	}

	.ml-banner__close {
		position: absolute;
		top: 50%;
		right: 0;
		transform: translateY(-50%);
	}

	@keyframes ml-banner-slide-in {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 480px) {
		.ml-banner {
			flex-direction: column;
			align-items: flex-start;
			gap: $spacing-xs;
		}
	}
</style>
