<script lang="ts">
	import type { PrimingNote, PrimingState } from '@/ui/store/priming.store';

	interface Props {
		primingState: PrimingState;
		onSelect: (index: number) => void;
	}

	let { primingState, onSelect }: Props = $props();

	let indexByPath = $derived(
		new Map(primingState.notes.map((note, index) => [note.path, index])),
	);
	let currentClusterIndex = $derived(
		primingState.clusters.findIndex((cluster) =>
			cluster.notes.some((note) => note.path === primingState.currentContent?.path),
		),
	);
	let currentCluster = $derived(
		currentClusterIndex >= 0 ? primingState.clusters[currentClusterIndex] : undefined,
	);
	let mobileOutlineOpen = $state(true);

	function isSelected(note: PrimingNote): boolean {
		return note.path === primingState.currentContent?.path;
	}

	function linkCountLabel(count: number): string {
		return `${count} inbound ${count === 1 ? 'link' : 'links'}`;
	}
</script>

{#snippet noteRow(note)}
	<button
		type="button"
		class="ml-priming__note-row"
		class:ml-priming__note-row--selected={isSelected(note)}
		aria-current={isSelected(note) ? 'true' : undefined}
		onclick={() => onSelect(indexByPath.get(note.path) ?? 0)}
	>
		<span class="ml-priming__note-title">{note.title}</span>
		<span class="ml-priming__note-meta">
			{linkCountLabel(note.inboundLinkCount)} · Average difficulty {note.averageDifficulty.toFixed(1)}
		</span>
	</button>
{/snippet}

<nav class="ml-priming__outline" aria-label="Backlink clusters">
	<h2 class="ml-priming__outline-label">Backlink clusters</h2>

	<div class="ml-priming__outline-stack">
		{#each primingState.clusters as cluster (cluster.notes[0]?.path)}
			{#if cluster.title}
				<div class="ml-priming__cluster-heading">
					<span class="ml-priming__cluster-title">{cluster.title}</span>
					<span class="ml-priming__cluster-metric">
						Cluster average {cluster.averageDifficulty.toFixed(1)}
					</span>
				</div>
			{:else}
				<div class="ml-priming__cluster-heading ml-priming__cluster-heading--untitled">
					<span class="ml-priming__cluster-metric">
						Cluster average {cluster.averageDifficulty.toFixed(1)}
					</span>
				</div>
			{/if}
			{#each cluster.notes as note (note.path)}
				{@render noteRow(note)}
			{/each}
		{/each}
	</div>

	{#if currentCluster}
		<div class="ml-priming__mobile-outline">
			<button
				type="button"
				class="ml-priming__disclosure"
				aria-expanded={mobileOutlineOpen}
				onclick={() => (mobileOutlineOpen = !mobileOutlineOpen)}
			>
				<span class="ml-priming__disclosure-label">
					⌄ Cluster {currentClusterIndex + 1} of {primingState.clusters.length}
				</span>
				{#if currentCluster.title}
					<span class="ml-priming__disclosure-title">{currentCluster.title}</span>
				{/if}
			</button>

			{#if mobileOutlineOpen}
				<div class="ml-priming__mobile-outline-stack">
					{#each currentCluster.notes as note (note.path)}
						{@render noteRow(note)}
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</nav>

<style lang="scss">
	@use 'tokens' as *;

	.ml-priming__outline {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		min-width: 0;
	}

	.ml-priming__outline-label {
		margin: 0;
		color: $text-normal;
		font-size: $font-sm;
		font-weight: $font-bold;
	}

	.ml-priming__outline-stack {
		display: flex;
		flex-direction: column;
		gap: $spacing-xxs;
	}

	.ml-priming__cluster-heading {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-top: $spacing-xs;

		&--untitled {
			padding-top: $spacing-xxs;
		}
	}

	.ml-priming__cluster-title {
		color: $text-normal;
		font-size: $font-xs;
		font-weight: $font-bold;
	}

	.ml-priming__cluster-metric {
		color: $text-muted;
		font-size: 11px;
	}

	.ml-priming__note-row {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		width: 100%;
		padding: $spacing-xxs $spacing-xs;
		border: none;
		border-left: 3px solid transparent;
		border-radius: $radius-xs;
		background: none;
		text-align: left;
		cursor: pointer;

		&:hover {
			background-color: $background-modifier-hover;
		}

		&--selected {
			background-color: $background-modifier-selected;
			border-left-color: $text-normal;

			&:hover {
				background-color: $background-modifier-selected;
			}
		}
	}

	.ml-priming__note-title {
		color: $text-normal;
		font-size: $font-xs;
		font-weight: $font-semibold;
	}

	.ml-priming__note-meta {
		color: $text-muted;
		font-size: 10px;
	}

	.ml-priming__mobile-outline {
		display: none;
	}

	@media (max-width: 480px) {
		.ml-priming__outline-stack {
			display: none;
		}

		.ml-priming__mobile-outline {
			display: flex;
			flex-direction: column;
		}

		.ml-priming__disclosure {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: $spacing-xs;
			width: 100%;
			padding: $spacing-sm;
			border: 1px solid $background-modifier-border;
			border-radius: $radius-sm;
			background-color: $background-primary;
			color: $text-normal;
			font-family: $font-interface;
			font-size: $font-sm;
			font-weight: $font-semibold;
			cursor: pointer;
		}

		.ml-priming__disclosure-title {
			color: $text-muted;
			font-size: $font-xs;
			font-weight: $font-normal;
		}

		.ml-priming__mobile-outline-stack {
			display: flex;
			flex-direction: column;
			gap: 2px;
			margin-top: $spacing-xxs;
		}
	}
</style>
