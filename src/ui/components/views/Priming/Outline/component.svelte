<script lang="ts">
	import { Button, Collapsible, Icon } from '@/ui/components/elements';
	import { cn } from '@/ui/components/utils';
	import type { PrimingNote, PrimingState } from '@/ui/store/priming.store';

	interface Props {
		primingState: PrimingState;
		onSelect: (index: number) => void;
	}

	let { primingState, onSelect }: Props = $props();

	let indexByPath = $derived(new Map(primingState.notes.map((note, index) => [note.path, index])));
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

{#snippet noteRow(note: PrimingNote)}
	<Button
		type="button"
		variant="ghost"
		class={cn('ml-priming__note-row', {
			'ml-priming__note-row--selected': isSelected(note),
		})}
		onclick={() => onSelect(indexByPath.get(note.path) ?? 0)}
	>
		<span class="ml-priming__note-title">{note.title}</span>
		<span class="ml-priming__note-meta">
			{linkCountLabel(note.inboundLinkCount)} · Average difficulty {note.averageDifficulty.toFixed(
				1,
			)}
		</span>
	</Button>
{/snippet}

<nav class="ml-priming__outline" aria-label="Backlink clusters">
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
		<Collapsible.Root bind:open={mobileOutlineOpen} class=" ml-priming__mobile-outline">
			<Collapsible.Trigger type="button" class="ml-priming__disclosure">
				<span class="ml-priming__disclosure-label">
					<Icon name="chevron-down" size={16} />
					Cluster {currentClusterIndex + 1} of {primingState.clusters.length}
				</span>
				{#if currentCluster.title}
					<span class="ml-priming__disclosure-title">{currentCluster.title}</span>
				{/if}
			</Collapsible.Trigger>

			<Collapsible.Content class="ml-priming__mobile-outline-content">
				<div class="ml-priming__mobile-outline-stack">
					{#each currentCluster.notes as note (note.path)}
						{@render noteRow(note)}
					{/each}
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	{/if}
</nav>

<style lang="scss">
	@use 'tokens' as *;
	@use 'breakpoints' as *;

	.ml-priming__outline {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		min-width: 0;

		:global .ml-priming__note-row {
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
				border-left-color: $background-modifier-border-selected;

				&:hover {
					background-color: $background-modifier-selected;
				}
			}
		}
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

	.ml-priming__note-title {
		color: $text-normal;
		font-size: $font-xs;
		font-weight: $font-semibold;
	}

	.ml-priming__note-meta {
		color: $text-muted;
		font-size: 10px;
	}

	:global(.ml-priming__mobile-outline) {
		display: none;
	}

	@media (max-width: $tablet-breakpoint) {
		.ml-priming__outline-stack {
			display: none;
		}

		:global(.ml-priming__mobile-outline) {
			display: flex;
			flex-direction: column;

			:global .ml-priming__disclosure {
				display: flex;
				align-items: center;
				justify-content: space-between;
				flex-wrap: wrap;
				gap: $spacing-xs;
				width: 100%;
				height: fit-content;
				min-height: 44px;
				padding: $spacing-sm;
				border: 1px solid $background-modifier-border;
				border-radius: $radius-sm;
				background-color: $background-primary;
				color: $text-normal;
				font-family: $font-interface;
				font-size: $font-sm;
				font-weight: $font-semibold;
				user-select: none;
				white-space: nowrap;
				cursor: pointer;
				transition: color 0.15s ease;
				box-shadow: none;

				&-label {
					display: inline-flex;
					gap: $spacing-xs;
					align-items: center;
				}

				&-title {
					display: block;
				}

				&:hover:not(:disabled) {
					color: $interactive-accent;
					box-shadow: none;
				}

				&:focus-visible {
					outline: 2px solid $interactive-accent;
					outline-offset: 2px;
				}
			}
		}

		:global(.ml-priming__disclosure-title) {
			color: $text-muted;
			font-size: $font-xs;
			font-weight: $font-normal;
		}

		:global(.ml-priming__mobile-outline-content .ml-collapsible__content-inner) {
			padding-block: 0;
			border-top: none;
		}

		:global(.ml-priming__mobile-outline-stack) {
			display: flex;
			flex-direction: column;
			gap: 2px;
			margin-top: $spacing-xxs;
		}
	}
</style>
