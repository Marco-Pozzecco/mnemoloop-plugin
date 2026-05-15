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

{#snippet actions(className?: string)}
	<div class="ml-header-actions {className}">
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
{/snippet}

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

		{@render actions('ml-header-actions__mobile')}
	</div>

	<div class="ml-progress-wrapper">
		<ProgressBar value={progress} />
	</div>

	{@render actions()}
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

	.ml-header-actions__mobile {
		display: none;
	}

	@media (max-width: 480px) {
		.ml-review-header {
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		.ml-review-stats {
			font-size: 0.75rem;
			gap: 0.5rem;
			flex: 0 1 auto;
			justify-content: start;
			order: 1;
			width: 100%;
		}

		.ml-stat-item {
			display: flex;
			flex-direction: row;
			align-items: center;
			gap: 0.4rem;
		}

		.ml-progress-wrapper {
			flex-basis: 100%;
			max-width: none;
			order: 3;
			width: 100%;
		}

		.ml-header-actions {
			display: none;
		}

		.ml-header-actions__mobile {
			display: flex;
			margin-left: auto;
		}
	}
</style>
