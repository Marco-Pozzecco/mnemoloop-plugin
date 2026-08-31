<script lang="ts">
	import { Button, Chip, Icon } from '@/ui/components/elements';
	import type { PrimingState } from '@/ui/store/priming.store';

	interface Props {
		state: PrimingState;
		onExit: () => void;
	}

	let { state, onExit }: Props = $props();
</script>

<header class="ml-priming__header">
	<Button type="button" class="ml-priming__exit" variant="link" onclick={onExit}>
		{#snippet icon()}
			<Icon name="arrow-left" size={16} />
		{/snippet}
		Dashboard
	</Button>
	<div class="ml-priming__header-content">
		<div class="ml-priming__header-title">
			<h1 class="ml-priming__title">Prime difficult notes</h1>
			<p class="ml-priming__subtitle">Review the connected material before your cards</p>
		</div>

		<div class="ml-priming__chips">
			<Chip class="ml-priming__chip">{state.selection.deckLabel}</Chip>
			<Chip class="ml-priming__chip">Difficulty &gt; {state.threshold.toFixed(1)}</Chip>
		</div>
	</div>
</header>

<style lang="scss">
	@use 'tokens' as *;
	@use 'breakpoints' as *;

	.ml-priming__header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: $spacing-xs;
	}

	.ml-priming__header-content {
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		justify-content: space-between;
		gap: $spacing-xs;
	}

	.ml-priming__header-title {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: $spacing-xs;
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
		justify-content: flex-end;
		gap: $spacing-xs;
		margin-top: $spacing-xxs;

		:global .ml-priming__chip {
			font-size: $font-sm;
			font-weight: $font-semibold;
			line-height: 1.2;
		}
	}

	@media (max-width: $mobile-breakpoint) {
		.ml-priming__header-content {
			flex-direction: column;
			justify-content: flex-start;
			align-items: flex-start;
		}

		.ml-priming__chips {
			justify-content: flex-start;
		}
	}
</style>
