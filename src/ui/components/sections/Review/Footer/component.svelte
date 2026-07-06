<script lang="ts">
	import { Button, Icon } from '@/ui/components';
	import type FooterProps from './types';

	const { position, total, onPrevious, onNext }: FooterProps = $props();
</script>

<footer class="ml-review-footer">
	<div class="ml-navigation-controls">
		<Button
			variant="secondary"
			size="small"
			onclick={onPrevious}
			disabled={position <= 1}
			ariaLabel="Previous card"
		>
			<Icon name="chevron-left" size={16} />
		</Button>
		<Button
			variant="secondary"
			size="small"
			onclick={onNext}
			disabled={position >= total}
			ariaLabel="Next card"
		>
			<Icon name="chevron-right" size={16} />
		</Button>
	</div>
</footer>

<style lang="scss">
	@use 'tokens' as *;

	.ml-review-footer {
		display: flex;
		justify-content: center;
		padding-bottom: 1rem;
	}

	.ml-navigation-controls {
		display: flex;
		gap: $spacing-xl;
	}

	@media (max-width: 480px) {
		.ml-review-footer {
			padding-bottom: 0.5rem;
		}

		.ml-navigation-controls {
			gap: $spacing-md;
		}
	}
</style>
