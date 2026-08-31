<script lang="ts">
	import { ProgressBar } from '@/ui/components/elements';
	import type { PrimingState } from '@/ui/store/priming.store';

	interface Props {
		state: PrimingState;
	}

	let { state }: Props = $props();
</script>

{#if state.status === 'ready'}
	<div class="ml-priming__progress">
		<span class="ml-priming__progress-count">
			{state.currentIndex + 1} of {state.notes.length} notes
		</span>
		<ProgressBar
			max={state.notes.length}
			value={state.currentIndex + 1}
			showPercentage
			ariaLabel="Priming progress"
		/>
	</div>
{/if}

<style lang="scss">
	@use 'tokens' as *;

	.ml-priming__progress {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
	}

	.ml-priming__progress-count {
		color: $text-normal;
		font-size: $font-sm;
		font-weight: $font-semibold;
	}
</style>
