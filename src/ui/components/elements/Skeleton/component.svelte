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
	class="ml-skeleton ml-skeleton--shimmer"
	class:ml-skeleton--text={shape === 'text'}
	class:ml-skeleton--circle={shape === 'circle'}
	style:width={width === 'full' ? undefined : width}
	style:height={height === 'full' ? undefined : height}
	style:border-radius={radius === 'full' ? undefined : radius}
>
	<div class="ml-skeleton__block"></div>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-skeleton {
		display: block;
		width: 100%;
		height: 100%;
	}

	.ml-skeleton--shimmer {
		border-radius: $radius-sm;
		overflow: hidden;
	}

	.ml-skeleton--text {
		border-radius: 9999px;
	}

	.ml-skeleton--circle {
		border-radius: 50%;
		aspect-ratio: 1 #{'/'} 1;
	}

	.ml-skeleton__block {
		width: 100%;
		height: 100%;
		border-radius: $radius-sm;
		background-color: $background-modifier-form-field;
		position: relative;
		overflow: hidden;
	}

	.ml-skeleton--text .ml-skeleton__block {
		border-radius: 9999px;
	}

	.ml-skeleton--circle .ml-skeleton__block {
		border-radius: 50%;
	}

	.ml-skeleton__block::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			transparent 0%,
			$background-modifier-hover 50%,
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
