<script lang="ts">
	import { Button, Icon } from '@/ui/components';
	import type EmptyStateProps from './types';

	const { onEndSession }: EmptyStateProps = $props();
</script>

<div class="ml-empty-state">
	<Icon name="check-circle" size={48} />
	<h2>Session complete!</h2>
	<p>You've reviewed all cards in this session.</p>
	<Button variant="primary" onclick={onEndSession}>Return to dashboard</Button>
</div>

<style>
	.ml-empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 1rem;
		padding: 3rem;
		background-color: var(--background-secondary);
		border-radius: 12px;
	}

	.ml-empty-state h2 {
		margin: 0;
	}

	.ml-empty-state p {
		color: var(--text-muted);
		margin-bottom: 1rem;
	}

	@media (max-width: 480px) {
		.ml-empty-state {
			padding: 2rem 1rem;
			gap: 0.75rem;
		}

		.ml-empty-state h2 {
			font-size: 1.25rem;
		}

		.ml-empty-state p {
			font-size: 0.9rem;
		}
	}
</style>
