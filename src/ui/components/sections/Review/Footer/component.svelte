<script lang="ts">
	import { Button, Icon } from '@/ui/components';
	import type FooterProps from './types';

	const { position, total, onPrevious, onNext }: FooterProps = $props();
</script>

<footer class="ka-review-footer">
	<div class="ka-navigation-controls">
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

<style>
	.ka-review-footer {
		display: flex;
		justify-content: center;
		padding-bottom: 1rem;
	}

	.ka-navigation-controls {
		display: flex;
		gap: 2rem;
	}

	@media (max-width: 480px) {
		.ka-review-footer {
			padding-bottom: 0.5rem;
		}

		.ka-navigation-controls {
			gap: 1rem;
		}
	}
</style>
