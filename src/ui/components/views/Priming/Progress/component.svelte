<script lang="ts">
	import type { PrimingState } from '@/ui/store/priming.store';

	interface Props {
		state: PrimingState;
	}

	let { state }: Props = $props();

	let progressPercent = $derived(
		state.status === 'ready' && state.notes.length > 0
			? ((state.currentIndex + 1) / state.notes.length) * 100
			: 0,
	);
</script>

{#if state.status === 'ready'}
	<div class="ml-priming__progress">
		<span class="ml-priming__progress-count">
			{state.currentIndex + 1} of {state.notes.length} notes
		</span>
		<div
			class="ml-priming__progress-track"
			role="progressbar"
			aria-label="Priming progress"
			aria-valuemin={1}
			aria-valuemax={state.notes.length}
			aria-valuenow={state.currentIndex + 1}
		>
			<div class="ml-priming__progress-fill" style:width="{progressPercent}%"></div>
		</div>
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

	.ml-priming__progress-track {
		width: 100%;
		height: 2px;
		background-color: $background-modifier-border;
		overflow: hidden;
	}

	.ml-priming__progress-fill {
		height: 100%;
		background-color: $text-normal;
		transition: width 0.3s ease;
	}
</style>
