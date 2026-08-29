<script lang="ts">
	import type { PrimingState } from '@/ui/store/priming.store';

	interface Props {
		state: PrimingState;
		onExit: () => void;
	}

	let { state, onExit }: Props = $props();
</script>

<header class="ml-priming__header">
	<button type="button" class="ml-priming__exit" onclick={onExit}>
		← Dashboard
	</button>
	<h1 class="ml-priming__title">Prime difficult notes</h1>
	<p class="ml-priming__subtitle">Review the connected material before your cards</p>
	<div class="ml-priming__chips">
		<span class="ml-priming__chip">{state.selection.deckLabel}</span>
		<span class="ml-priming__chip">Difficulty &gt; {state.threshold.toFixed(1)}</span>
	</div>
</header>

<style lang="scss">
	@use 'tokens' as *;

	.ml-priming__header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: $spacing-xs;
	}

	.ml-priming__exit {
		appearance: none;
		background: none;
		border: none;
		padding: 0;
		color: $text-normal;
		font-family: $font-interface;
		font-size: $font-sm;
		font-weight: $font-semibold;
		cursor: pointer;

		&:hover {
			color: $text-accent;
		}
	}

	.ml-priming__title {
		margin: 0;
		color: $text-normal;
		font-size: $heading-lg;
		font-weight: $font-bold;
		line-height: 1.45;
	}

	.ml-priming__subtitle {
		margin: 0;
		color: $text-muted;
		font-size: $font-sm;
	}

	.ml-priming__chips {
		display: flex;
		flex-wrap: wrap;
		gap: $spacing-xs;
		margin-top: $spacing-xxs;
	}

	.ml-priming__chip {
		display: inline-flex;
		align-items: center;
		padding: $spacing-xxs $spacing-sm;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-sm;
		color: $text-normal;
		font-size: $font-xs;
		font-weight: $font-semibold;
		line-height: 1.2;
	}
</style>
