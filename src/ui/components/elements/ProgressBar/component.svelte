<script lang="ts">
	import type ProgressBarProps from './types';

	let {
		value = 0,
		max = 100,
		indeterminate = false,
		ariaLabel = 'Progress',
		showPercentage = false,
		class: className = '',
	}: ProgressBarProps = $props();

	let percentage = $derived(Math.min(Math.max(0, (value / max) * 100), 100));
</script>

<div
	class="ml-progress-container {className}"
	role="progressbar"
	aria-label={ariaLabel}
	aria-valuemin="0"
	aria-valuemax={max}
	aria-valuenow={indeterminate ? undefined : value}
>
	<div class="ml-progress-track">
		<div
			class="ml-progress-fill"
			class:ml-progress-fill--indeterminate={indeterminate}
			style:width={indeterminate ? '100%' : `${percentage}%`}
		></div>
	</div>

	{#if showPercentage && !indeterminate}
		<span class="ml-progress-label">
			{Math.round(percentage)}%
		</span>
	{/if}
</div>

<style>
	.ml-progress-container {
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: 100%;
	}

	.ml-progress-track {
		height: 8px;
		width: 100%;
		background-color: var(--background-modifier-border);
		border-radius: 4px;
		overflow: hidden;
		position: relative;
	}

	.ml-progress-fill {
		height: 100%;
		background-color: var(--interactive-accent);
		border-radius: 4px;
		transition: width 0.3s ease-in-out;
	}

	.ml-progress-fill--indeterminate {
		width: 30% !important;
		position: absolute;
		animation: indeterminate-progress 1.5s infinite linear;
		transform-origin: 0% 50%;
	}

	.ml-progress-label {
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	@keyframes indeterminate-progress {
		0% {
			left: -30%;
		}
		100% {
			left: 100%;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.ml-progress-track {
			border: 1px solid currentColor;
		}
		.ml-progress-fill {
			background-color: Highlight;
		}
	}
</style>
