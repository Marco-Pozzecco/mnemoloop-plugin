<script lang="ts">
	import type { OcclusionRecapItem } from './types';

	let { items }: { items: OcclusionRecapItem[] } = $props();

	const total = $derived(items.length);
	const correctCount = $derived(items.filter((item) => item.status === 'correct').length);
	const missedCount = $derived(total - correctCount);
</script>

<section class="ml-occlusion-recap" aria-label="Card recap">
	<div class="ml-occlusion-recap__head">
		<div class="ml-occlusion-recap__score">
			{correctCount} of {total}&#32;<span class="ml-occlusion-recap__score-label">correct</span>
		</div>
		{#if missedCount > 0}
			<span class="ml-occlusion-recap__missing">{missedCount} missed</span>
		{/if}
	</div>

	<ul class="ml-occlusion-recap__list">
		{#each items as item, index (index)}
			<li class="ml-occlusion-recap__item ml-occlusion-recap__item--{item.status}">
				<span class="ml-occlusion-recap__mark">{item.status === 'correct' ? '✓' : '✕'}</span>
				<span class="ml-occlusion-recap__answer">{item.answer}</span>
			</li>
		{/each}
	</ul>

	{#if missedCount > 0}
		<p class="ml-occlusion-recap__note">…and {correctCount} correct</p>
	{/if}
</section>

<style lang="scss">
	@use 'tokens' as *;
	@use 'breakpoints' as *;

	.ml-occlusion-recap {
		border: $border-width solid $background-modifier-border;
		border-radius: $radius-md;
		background: $background-primary;
		padding: $spacing-sm $spacing-md;
	}

	.ml-occlusion-recap__head {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		margin-bottom: $spacing-xs;
	}

	.ml-occlusion-recap__score {
		font-size: $font-lg;
		font-weight: $font-bold;
		color: $text-normal;
		white-space: nowrap;
	}

	.ml-occlusion-recap__score-label {
		color: $text-muted;
		font-size: $font-xs;
		font-weight: $font-normal;
	}

	.ml-occlusion-recap__missing {
		border: $border-width solid color-mix(in srgb, $text-error 55%, transparent);
		border-radius: 999px;
		background: color-mix(in srgb, $text-error 12%, transparent);
		color: $text-error;
		font-size: $font-xs;
		padding: 2px $spacing-xs;
		white-space: nowrap;
	}

	.ml-occlusion-recap__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: $spacing-xxs $spacing-lg;
	}

	.ml-occlusion-recap__item {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		min-width: 0;
		color: $text-muted;
		font-size: $font-sm;
	}

	.ml-occlusion-recap__mark {
		width: 0.9rem;
		text-align: center;
		font-weight: $font-bold;
		flex: 0 0 auto;
	}

	.ml-occlusion-recap__answer {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ml-occlusion-recap__item--correct .ml-occlusion-recap__mark {
		color: $status-success;
	}

	.ml-occlusion-recap__item--missed {
		color: $text-normal;
		font-weight: $font-semibold;

		.ml-occlusion-recap__mark {
			color: $text-error;
		}
	}

	.ml-occlusion-recap__note {
		display: none;
		margin: $spacing-xs 0 0;
		color: $text-muted;
		font-size: $font-xs;
	}

	@media (max-width: $mobile-breakpoint) {
		.ml-occlusion-recap__list {
			grid-template-columns: minmax(0, 1fr);
		}

		.ml-occlusion-recap__item--correct {
			display: none;
		}

		.ml-occlusion-recap__note {
			display: block;
		}
	}
</style>
