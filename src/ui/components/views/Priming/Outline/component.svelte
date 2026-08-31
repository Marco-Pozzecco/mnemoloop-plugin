<script lang="ts">
	import { Button, Collapsible, Icon } from '@/ui/components/elements';
	import { cn } from '@/ui/components/utils';
	import type { PrimingCluster, PrimingNote, PrimingState } from '@/ui/store/priming.store';

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

	function isActiveCluster(cluster: PrimingCluster): boolean {
		return cluster.notes.some((note) => note.path === primingState.currentContent?.path);
	}

	function isStudiedCluster(clusterIndex: number): boolean {
		return clusterIndex < currentClusterIndex;
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

{#snippet Cluster(open: boolean, index: number, cluster: PrimingCluster, isMobile: boolean)}
	<Collapsible.Root {open} class="ml-priming__cluster">
		<Collapsible.Trigger
			type="button"
			class={cn('ml-priming__cluster-disclosure', {
				'ml-priming__cluster-disclosure--active': isActiveCluster(cluster),
				'ml-priming__cluster-disclosure--dimmed': isStudiedCluster(index),
			})}
		>
			<div class="ml-priming__cluster-disclosure-label">
				<Icon name="chevron-down" size={16} />
				Cluster {index + 1} of {primingState.clusters.length}
				<span class="ml-priming__cluster-disclosure-metric">
					avg. {cluster.averageDifficulty.toFixed(1)}
				</span>
			</div>
			{#if cluster.title}
				<span class="ml-priming__cluster-disclosure-title">{cluster.title}</span>
			{/if}
		</Collapsible.Trigger>
		<Collapsible.Content
			class={cn('ml-priming__cluster-content', {
				'ml-priming__cluster-content-desktop': !isMobile,
				'ml-priming__cluster-content-mobile': isMobile,
			})}
		>
			{#each cluster.notes as note (note.path)}
				{@render noteRow(note)}
			{/each}
		</Collapsible.Content>
	</Collapsible.Root>
{/snippet}

<nav class="ml-priming__outline" aria-label="Backlink clusters">
	<div class="ml-priming__outline-stack ml-priming__outline-stack-desktop">
		{#each primingState.clusters as cluster, clusterIndex (cluster.notes[0]?.path)}
			{@render Cluster(isActiveCluster(cluster), clusterIndex, cluster, false)}
		{/each}
	</div>

	{#if currentCluster}
		<div class="ml-priming__outline-stack ml-priming__outline-stack-mobile">
			{@render Cluster(mobileOutlineOpen, currentClusterIndex, currentCluster, true)}
		</div>
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

		&-stack {
			display: flex;
			flex-direction: column;
			gap: $spacing-xxs;

			&-desktop {
				display: flex;
				overflow: auto;
				@media (max-width: $tablet-breakpoint) {
					display: none;
				}
			}

			&-mobile {
				display: none;

				@media (max-width: $tablet-breakpoint) {
					display: flex;
				}
			}
		}

		:global .ml-priming__cluster {
			display: flex;
			flex-direction: column;
			gap: $spacing-xxs;

			& :global .ml-collapsible__content-inner {
				height: 100%;
			}

			&-disclosure {
				position: relative;
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

				@media (max-width: $tablet-breakpoint) {
					flex-direction: column;
					align-items: flex-start;
				}

				&--active {
					border-left-color: $interactive-accent;
				}

				&--dimmed {
					opacity: 0.5;
				}

				&-label {
					display: inline-flex;
					gap: $spacing-xs;
					align-items: center;
					margin: 0;
					color: $text-muted;
					font-size: $font-xs;
					font-weight: $font-normal;
				}

				&-title {
					color: $text-normal;
					font-size: $font-sm;
				}

				&-metric {
					position: absolute;
					top: $spacing-xs;
					right: $spacing-xs;
					font-size: $font-xs;
				}

				&:hover:not(:disabled) {
					background-color: $background-modifier-hover;
					box-shadow: none;
					transition: background-color $transition-fast;
				}

				&:focus-visible {
					outline: 2px solid $interactive-accent;
					outline-offset: 2px;
				}

				&-content {
					padding-block: 0;
					border-top: none;
				}
			}

			.ml-priming__cluster-heading {
				border-left: 3px solid transparent;
				padding-inline-start: $spacing-xs;
			}
		}

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

		.ml-priming__note-title {
			color: $text-normal;
			font-size: $font-xs;
			font-weight: $font-semibold;
		}

		.ml-priming__note-meta {
			color: $text-muted;
			font-size: 10px;
		}
	}
</style>
