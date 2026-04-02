<script lang="ts">
	import { Button, Icon, ProgressBar } from '@/ui/components';
	import type HeaderProps from './types';

	const { position, total, remaining, progress, onEndSession }: HeaderProps = $props();
</script>

<header class="ka-review-header">
	<div class="ka-review-stats">
		<span class="ka-stat-item">
			<Icon name="layers" size={14} />
			<span>{position}/{total}</span>
		</span>
		<span class="ka-stat-item">
			<Icon name="clock" size={14} />
			<span>{remaining}</span>
		</span>
	</div>

	<div class="ka-progress-wrapper">
		<ProgressBar value={progress} />
	</div>

	<Button variant="secondary" size="small" onclick={onEndSession}>
		<Icon name="x" size={18} />
	</Button>
</header>

<style>
	.ka-review-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.ka-review-stats {
		display: flex;
		gap: 1rem;
		color: var(--text-muted);
		font-size: 0.85rem;
	}

	.ka-stat-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.ka-progress-wrapper {
		flex: 1;
	}

	@media (max-width: 480px) {
		.ka-review-stats {
			font-size: 0.75rem;
			gap: 0.5rem;
		}
	}
</style>
