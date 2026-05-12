<script lang="ts">
	import type SkeletonProps from './types';

	const {
		width = 'full',
		height = 'full',
		shape = 'default',
		radius = 'full',
	}: SkeletonProps = $props();
</script>

<div
	class="ka-skeleton ka-skeleton--shimmer"
	class:ka-skeleton--text={shape === 'text'}
	class:ka-skeleton--circle={shape === 'circle'}
	style:width={width === 'full' ? undefined : width}
	style:height={height === 'full' ? undefined : height}
	style:border-radius={radius === 'full' ? undefined : radius}
>
	<div class="ka-skeleton__block"></div>
</div>

<style>
	.ka-skeleton {
		display: block;
		width: 100%;
		height: 100%;
	}

	.ka-skeleton--shimmer {
		border-radius: var(--radius-s, 4px);
		overflow: hidden;
	}

	.ka-skeleton--text {
		border-radius: 9999px;
	}

	.ka-skeleton--circle {
		border-radius: 50%;
		aspect-ratio: 1 / 1;
	}

	.ka-skeleton__block {
		width: 100%;
		height: 100%;
		border-radius: var(--radius-s, 4px);
		background-color: var(--background-modifier-form-field);
		position: relative;
		overflow: hidden;
	}

	.ka-skeleton--text .ka-skeleton__block {
		border-radius: 9999px;
	}

	.ka-skeleton--circle .ka-skeleton__block {
		border-radius: 50%;
	}

	.ka-skeleton__block::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			transparent 0%,
			var(--background-modifier-hover) 50%,
			transparent 100%
		);
		transform: translateX(-100%);
		animation: shimmer 1.5s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}
</style>
