<script lang="ts">
	import { Button, Icon, ProgressBar } from '@/ui/components';
	import type HeaderProps from './types';

	const {
		position,
		total,
		progress,
		onEndSession,
		accuracy = 0,
		startTime,
		onUndo,
		canUndo,
	}: HeaderProps = $props();

	let elapsedTime = $state(0); // seconds

	const formattedTime = $derived(() => {
		const minutes = Math.floor(elapsedTime / 60);
		const seconds = Math.floor(elapsedTime % 60);
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	});

	const accuracyPercent = $derived(() => {
		return Math.round(accuracy * 100);
	});

	$effect(() => {
		const interval = setInterval(() => {
			elapsedTime = (Date.now() - startTime) / 1000;
		}, 1000);
		return () => clearInterval(interval);
	});
</script>

<header class="ml-review-header">
	<div class="ml-review-stats">
		<span class="ml-stat-item ml-stat-primary">
			<Icon name="layers" size={14} />
			<span>{position}/{total}</span>
		</span>

		<span class="ml-stat-item ml-stat-secondary">
			<Icon name="percent" size={14} />
			<span>{accuracyPercent()}</span>
		</span>

		<span class="ml-stat-item ml-stat-secondary">
			<Icon name="timer" size={14} />
			<span>{formattedTime()}</span>
		</span>
	</div>

	<div class="ml-progress-wrapper">
		<ProgressBar value={progress} />
	</div>

	<div class="ml-header-actions">
		<Button
			variant="secondary"
			size="small"
			disabled={!canUndo}
			onclick={onUndo}
			ariaLabel="Undo last rating"
		>
			<Icon name="undo" size={18} />
		</Button>
		<Button variant="secondary" size="small" onclick={onEndSession}>
			<Icon name="x" size={18} />
		</Button>
	</div>
</header>

<style>
	.ml-review-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.ml-review-stats {
		display: flex;
		gap: 1rem;
		color: var(--text-muted);
		font-size: 0.85rem;
	}

	.ml-stat-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.ml-progress-wrapper {
		flex: 1;
	}

	.ml-stat-secondary {
		color: var(--text-muted);
	}

	.ml-header-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	@media (max-width: 480px) {
		.ml-review-stats {
			font-size: 0.75rem;
			gap: 0.5rem;
		}

		.ml-stat-secondary {
			display: none;
		}
	}
</style>
