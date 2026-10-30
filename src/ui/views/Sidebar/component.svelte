<script lang="ts">
	import { CardStatus } from '@/schemas';
	import type { Flashcard, FlashcardMetadata } from '@/schemas';
	import { Button, Collapsible, Icon, Skeleton } from '@/ui/components/elements';
	import { FlashcardForm } from '@/ui/components/sections';
	import { SidebarController } from '@/ui/controllers/SidebarController';
	import { sidebarStore } from '@/ui/store/sidebar.store';
	import { onDestroy, onMount } from 'svelte';
	import type SidebarProps from './types';
	import { groupAriaLabel, groupCardsByStatus, noteFolder } from './utils';

	let {
		app,
		collapsedGroups = [],
		onCollapsedGroupsChange,
	}: SidebarProps = $props();

	const controller = new SidebarController(app);
	const storeRef = sidebarStore.store;
	const state = $derived($storeRef);

	let collapsed = $state<string[]>([...collapsedGroups]);
	const groups = $derived(groupCardsByStatus(state.cards));
	const folder = $derived(state.activeNote ? noteFolder(state.activeNote.path) : '');

	/**
	 * The form open in the panel, bound to the note it was opened for. The panel
	 * shows one surface at a time: the list, or this form in the list's place.
	 */
	type PanelForm =
		| { kind: 'create'; notePath: string; source: string }
		| { kind: 'edit'; notePath: string; card: Flashcard };

	let form = $state<PanelForm | null>(null);

	onMount(() => {
		void controller.init();
	});

	onDestroy(() => {
		controller.dispose();
	});

	// A form belongs to the note it was opened for. If the note changes while it
	// is open, discard the unsaved input and show the new note's list.
	$effect(() => {
		if (!form) return;
		const activePath = state.activeNote?.path ?? null;
		if (activePath !== form.notePath) form = null;
	});

	function setGroupOpen(status: CardStatus, open: boolean): void {
		const next = collapsed.filter((value) => value !== status);
		if (!open) next.push(status);
		collapsed = next;
		onCollapsedGroupsChange?.([...next]);
	}

	function handleAdd(): void {
		if (!state.activeNote) return;
		form = {
			kind: 'create',
			notePath: state.activeNote.path,
			source: `[[${state.activeNote.path}]]`,
		};
	}

	async function handleEdit(card: FlashcardMetadata): Promise<void> {
		const notePath = state.activeNote?.path;
		if (!notePath) return;

		const fullCard = await controller.fetchCard(card.file);
		if (!fullCard) return;
		// The note may have changed while the card was being fetched; opening the
		// form then would bind it to a note the card is no longer listed under.
		if (state.activeNote?.path !== notePath) return;

		form = { kind: 'edit', notePath, card: fullCard };
	}

	function closeForm(): void {
		form = null;
	}
</script>

<div class="ml-flashcard-sidebar">
	<!-- Head: which note, and the one action. Pinned, so the action never scrolls away. -->
	<div class="ml-sidebar__head">
		{#if state.activeNote}
			<div class="ml-sidebar__source">
				<Icon name="file-text" size={16} />
				<div class="ml-sidebar__source-text">
					<h2 class="ml-sidebar__source-name">{state.activeNote.name}</h2>
					{#if folder}
						<p class="ml-sidebar__source-path">{folder}</p>
					{/if}
				</div>
			</div>
		{:else}
			<div class="ml-sidebar__source ml-sidebar__source--none">
				<div class="ml-sidebar__source-text">
					<h2 class="ml-sidebar__source-name">No note open</h2>
					<p class="ml-sidebar__source-path">
						Open a markdown note to see and add its flashcards.
					</p>
				</div>
			</div>
		{/if}

		<Button
			variant="primary"
			size="small"
			class="ml-sidebar__new"
			disabled={!state.activeNote || form !== null}
			onclick={handleAdd}
		>
			{#snippet icon()}
				<Icon name="plus" size={14} />
			{/snippet}
			New card
		</Button>
	</div>

	<div class="ml-sidebar__body">
		{#if form && form.kind === 'create'}
			<FlashcardForm
				mode="create"
				prefillSource={form.source}
				onSaved={closeForm}
				onCancel={closeForm}
			/>
		{:else if form && form.kind === 'edit'}
			<FlashcardForm mode="edit" card={form.card} onSaved={closeForm} onCancel={closeForm} />
		{:else if state.activeNote === null}
			<!-- No active note: the head states it, and there is nothing to list. -->
		{:else if state.isLoading}
			<div class="ml-sidebar__loading" role="status" aria-label="Loading flashcards">
				<div class="ml-sidebar-group ml-sidebar-group--skeleton" aria-hidden="true">
					<div class="ml-sidebar-group__trigger">
						<Skeleton width="14px" height="14px" />
						<Skeleton shape="text" width="64px" height="12px" />
						<Skeleton width="22px" height="16px" />
					</div>
					<ul class="ml-sidebar__rows">
						{#each [0, 1, 2] as index (index)}
							<li class="ml-sidebar__row-item">
								<div class="ml-sidebar-row ml-sidebar-row--skeleton">
									<Skeleton shape="text" width="80%" height="12px" />
									<Skeleton shape="text" width="40%" height="10px" />
								</div>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		{:else if groups.length === 0}
			<div class="ml-sidebar__empty">
				<p class="ml-sidebar__empty-title">No cards from this note yet</p>
				<p class="ml-sidebar__empty-message">Cards you create here are linked to this note.</p>
			</div>
		{:else}
			<div class="ml-sidebar__groups">
				{#each groups as group (group.status)}
					<Collapsible.Root
						open={!collapsed.includes(group.status)}
						onOpenChange={(open) => setGroupOpen(group.status, open)}
						class="ml-sidebar-group {group.status === CardStatus.STALE
							? 'ml-sidebar-group--stale'
							: ''}"
					>
						<Collapsible.Trigger
							type="button"
							class="ml-sidebar-group__trigger"
							aria-label={groupAriaLabel(group.label, group.cards.length)}
						>
							<Icon name="chevron-right" size={14} class="ml-sidebar-group__chevron" />
							<span class="ml-sidebar-group__label">{group.label}</span>
							<span class="ml-sidebar-group__count">{group.cards.length}</span>
						</Collapsible.Trigger>
						<Collapsible.Content class="ml-sidebar-group__content">
							<ul class="ml-sidebar__rows">
								{#each group.cards as card (card.uuid)}
									<li class="ml-sidebar__row-item">
										<button
											type="button"
											class="ml-sidebar-row"
											aria-label="Edit {card.card_type} card: {state.previews[card.file] ?? ''}"
											onclick={() => void handleEdit(card)}
										>
											{#if state.previews[card.file] !== undefined}
												<span class="ml-sidebar-row__preview">{state.previews[card.file]}</span>
											{:else}
												<Skeleton shape="text" width="80%" height="12px" />
											{/if}
											<span class="ml-sidebar-row__type">{card.card_type}</span>
										</button>
									</li>
								{/each}
							</ul>
						</Collapsible.Content>
					</Collapsible.Root>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use 'tokens' as *;

	/* --- Panel shell ---------------------------------------------------- */

	.ml-flashcard-sidebar {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		overflow: hidden;
		background-color: $background-secondary;
		color: $text-normal;
		font-family: $font-interface;
		font-size: $font-sm;
	}

	/* --- Head ----------------------------------------------------------- */

	.ml-sidebar__head {
		display: flex;
		flex-direction: column;
		flex: none;
		padding: $spacing-sm;
		border-bottom: 1px solid $background-modifier-border;
	}

	.ml-sidebar__source {
		display: flex;
		align-items: flex-start;
		gap: $spacing-xs;
		min-width: 0;
		color: $text-muted;
	}

	.ml-sidebar__source-text {
		min-width: 0;
		flex: 1;
	}

	.ml-sidebar__source-name {
		margin: 0;
		font-size: $font-md;
		font-weight: $font-semibold;
		line-height: 1.3;
		color: $text-normal;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ml-sidebar__source-path {
		margin: 2px 0 0;
		font-size: $font-xs;
		line-height: 1.4;
		color: $text-muted;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* No active note: there is no file to name, so the block drops its icon and
	   states the situation instead. */
	.ml-sidebar__source--none .ml-sidebar__source-name {
		color: $text-muted;
	}

	.ml-sidebar__source--none .ml-sidebar__source-path {
		white-space: normal;
	}

	/* --- Body ----------------------------------------------------------- */

	.ml-sidebar__body {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: $spacing-sm;
	}

	/* The panel is narrower than the modal, so the form's type tabs sit two per
	   row here instead of five across. */
	.ml-sidebar__body :global(.ml-card-type-tabs-list .ml-tabs__trigger) {
		flex-basis: calc(50% - #{$spacing-sm});
	}

	/* --- Status groups (accordion) -------------------------------------- */

	/* The groups stack and scroll as one column. `flex: none` keeps the column
	   taller than the body (which scrolls) instead of letting it shrink and
	   overlap the next group. */
	.ml-sidebar__groups {
		display: flex;
		flex-direction: column;
		flex: none;
		gap: $spacing-sm;
	}

	/* One group is one bordered surface. Rows inside it are flat and separated
	   by a hairline, so the panel reads as a few surfaces, not a dozen cards. */
	:global .ml-sidebar-group {
		border: $border-width solid $background-modifier-border;
		border-radius: $radius-md;
		background-color: $background-primary;
		overflow: hidden;
	}

	/* The header is the whole control: it names the status and carries the count. */
	:global .ml-sidebar-group__trigger {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		width: 100%;
		margin: 0;
		padding: $spacing-sm;
		font-family: inherit;
		font-size: $font-sm;
		font-weight: $font-medium;
		line-height: 1.4;
		color: $text-normal;
		text-align: start;
		background: none;
		border: none;
		box-shadow: none;
		cursor: pointer;
		transition: background-color $transition-fast;
	}

	:global .ml-sidebar-group__trigger:hover {
		background-color: $background-modifier-hover;
	}

	:global .ml-sidebar-group__trigger:focus-visible {
		outline: 2px solid $interactive-accent;
		outline-offset: -2px;
	}

	:global .ml-sidebar-group__chevron {
		flex: none;
		color: $text-muted;
		transition: transform $transition-fast;
	}

	:global .ml-sidebar-group[data-state='open'] .ml-sidebar-group__chevron {
		transform: rotate(90deg);
	}

	:global .ml-sidebar-group__label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* The count badge — the one badge in the panel, and the only place the number
	   of cards is stated. It is neutral metadata, so it stays muted. */
	:global .ml-sidebar-group__count {
		flex: none;
		margin-inline-start: auto;
		padding: 1px $spacing-xs;
		border-radius: $radius-sm;
		font-size: $font-xs;
		font-variant-numeric: tabular-nums;
		line-height: 1.4;
		color: $text-muted;
		background-color: $background-modifier-hover;
	}

	/* Stale is the one group that asks for attention, and the count badge's warm
	   fill carries the warning on its own. */
	:global .ml-sidebar-group--stale .ml-sidebar-group__count {
		color: $text-normal;
		background-color: $status-warning-background;
	}

	/* Rows sit flush inside the group surface; the Collapsible's own inner
	   padding is dropped so the group reads edge to edge. */
	:global .ml-sidebar-group__content .ml-collapsible__content-inner {
		padding: 0;
	}

	/* --- Rows ----------------------------------------------------------- */

	.ml-sidebar__rows {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.ml-sidebar__row-item {
		margin: 0;
		min-width: 0;
	}

	.ml-sidebar__row-item + .ml-sidebar__row-item {
		border-top: 1px solid $background-modifier-border;
	}

	/* The whole row is the control: clicking a card opens it for editing. */
	.ml-sidebar-row {
		display: flex;
		flex-direction: column;
		gap: $spacing-xxs;
		width: 100%;
		min-width: 0;
		margin: 0;
		padding: $spacing-sm;
		font-family: inherit;
		font-size: $font-sm;
		color: $text-normal;
		text-align: start;
		background: none;
		border: none;
		box-shadow: none;
		cursor: pointer;
		transition: background-color $transition-fast;
	}

	.ml-sidebar-row:hover {
		background-color: $background-modifier-hover;
	}

	.ml-sidebar-row:focus-visible {
		outline: 2px solid $interactive-accent;
		outline-offset: -2px;
	}

	/* The preview is the card's content — the thing being scanned — so it leads
	   the row and carries the strongest ink. */
	.ml-sidebar-row__preview {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
		line-height: 1.45;
		color: $text-normal;
		overflow-wrap: anywhere;
	}

	/* The type is metadata, so it is a quiet label under the content — never a
	   chip. Capitalised to match the vocabulary Manage already uses. */
	.ml-sidebar-row__type {
		font-size: $font-xs;
		line-height: 1.4;
		color: $text-muted;
		text-transform: capitalize;
	}

	/* --- States --------------------------------------------------------- */

	.ml-sidebar__empty,
	.ml-sidebar__loading {
		margin: 0;
	}

	/* Empty is quiet: no border, no card, no repeated action — the head already
	   carries the one action. It only explains the binding. */
	.ml-sidebar__empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $spacing-xxs;
		padding: $spacing-xl $spacing-sm;
		text-align: center;
	}

	.ml-sidebar__empty-title {
		margin: 0;
		font-size: $font-sm;
		font-weight: $font-medium;
		line-height: 1.4;
		color: $text-normal;
	}

	.ml-sidebar__empty-message {
		margin: 0;
		font-size: $font-xs;
		line-height: 1.5;
		color: $text-muted;
		overflow-wrap: anywhere;
	}

	/* The skeleton mirrors the real composition — one group surface, one header,
	   flat rows — so nothing shifts when the list arrives. */
	:global .ml-sidebar-group--skeleton,
	:global .ml-sidebar-group--skeleton .ml-sidebar-group__trigger {
		cursor: default;
	}

	:global .ml-sidebar-group--skeleton .ml-sidebar-group__trigger:hover {
		background-color: transparent;
	}

	.ml-sidebar-row--skeleton {
		cursor: default;
	}

	.ml-sidebar-row--skeleton:hover {
		background-color: transparent;
	}

	/* ====================================================================
	   Coarse pointer — the only query the panel needs.
	   Hover does not exist on touch, so hover becomes press, and both the
	   header and the row keep a target well above 44px.
	   ==================================================================== */

	@media (hover: none) and (pointer: coarse) {
		:global .ml-sidebar-group__trigger {
			min-height: 44px;
		}

		.ml-sidebar-row {
			min-height: 44px;
			user-select: none;
			-webkit-user-select: none;
		}

		:global .ml-sidebar-group__trigger:hover {
			background-color: transparent;
		}

		.ml-sidebar-row:hover {
			background-color: transparent;
		}

		:global .ml-sidebar-group__trigger:active {
			background-color: $background-modifier-active;
		}

		.ml-sidebar-row:active {
			background-color: $background-modifier-active;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global .ml-sidebar-group__chevron,
		:global .ml-sidebar-group__trigger,
		.ml-sidebar-row {
			transition: none;
		}
	}
</style>
