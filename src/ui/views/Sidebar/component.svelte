<script lang="ts">
	import type { Flashcard, FlashcardMetadata } from '@/schemas';
	import { CardStatus } from '@/schemas';
	import { Button, Collapsible, Icon, Skeleton } from '@/ui/components/elements';
	import type { FlashcardFormSavePayload } from '@/ui/components/compositions/FlashcardForm/types';
	import { SidebarFlashcardForm, SidebarFlashcardList } from '@/ui/components/views';
	import { setAppContext } from '@/ui/context/AppContext';
	import { SidebarController } from '@/ui/controllers/SidebarController';
	import { sidebarStore } from '@/ui/store/sidebar.store';
	import { groupAriaLabel, groupCardsByStatus, noteFolder } from '@/ui/views/Sidebar/utils';
	import { Notice } from 'obsidian';
	import { onDestroy, onMount } from 'svelte';
	import type SidebarProps from './types';

	let { app, component, collapsedGroups = [], onCollapsedGroupsChange }: SidebarProps = $props();

	// The props are stable for the life of a mounted view; the context and the
	// controller are created once, and restored collapse state seeds the panel.
	// svelte-ignore state_referenced_locally
	setAppContext({ app, component });

	// svelte-ignore state_referenced_locally
	const controller = new SidebarController(app);
	const storeRef = sidebarStore.store;
	const sidebarState = $derived($storeRef);

	// svelte-ignore state_referenced_locally
	let collapsed = $state<string[]>([...collapsedGroups]);
	const groups = $derived(groupCardsByStatus(sidebarState.cards));
	const folder = $derived(sidebarState.activeNote ? noteFolder(sidebarState.activeNote.path) : '');
	const contextLabel = $derived(
		sidebarState.activeNote ? `${sidebarState.activeNote.name}${folder ? ` · ${folder}` : ''}` : '',
	);

	// svelte-ignore state_referenced_locally
	const vaultName = app.vault.getName();
	function hrefFor(card: FlashcardMetadata): string {
		return `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(card.file)}`;
	}

	/**
	 * The form open in the panel, bound to the note it was opened for. The panel
	 * shows one surface at a time: the list, or this form in the list's place.
	 */
	type PanelForm =
		| { kind: 'create'; notePath: string | null; source: string }
		| { kind: 'edit'; notePath: string; card: Flashcard; file: string };

	let form = $state<PanelForm | null>(null);
	/** Guards against an older card fetch landing after a newer one. */
	let openRequest = 0;

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
		const activePath = sidebarState.activeNote?.path ?? null;
		if (activePath !== form.notePath) {
			openRequest++;
			controller.cancelPendingWrites();
			form = null;
		}
	});

	function setGroupOpen(status: CardStatus, open: boolean): void {
		const next = collapsed.filter((value) => value !== status);
		if (!open) next.push(status);
		collapsed = next;
		onCollapsedGroupsChange?.([...next]);
	}

	function openCreateForm(source: string): void {
		openRequest++;
		form = {
			kind: 'create',
			notePath: sidebarState.activeNote?.path ?? null,
			source,
		};
	}

	function handleAdd(): void {
		if (!sidebarState.activeNote) return;
		openCreateForm(`[[${sidebarState.activeNote.path}]]`);
	}

	// Another surface (the file-menu command) can ask the panel for its create
	// form. The request is one-shot: consume it before opening, so a remount
	// never reopens the form.
	$effect(() => {
		const request = sidebarState.pendingCreate;
		if (!request) return;
		sidebarStore.consumeCreateRequest(request.id);
		openCreateForm(request.source);
	});

	async function handleEdit(card: FlashcardMetadata): Promise<void> {
		const notePath = sidebarState.activeNote?.path;
		if (!notePath) return;

		const request = ++openRequest;
		const fullCard = await controller.fetchCard(card.file);

		// A newer row was clicked, the user backed out, or the note changed while
		// the card was being fetched.
		if (request !== openRequest) return;
		if (sidebarState.activeNote?.path !== notePath) return;
		if (!fullCard) {
			new Notice('Couldn’t open that flashcard.');
			return;
		}

		form = { kind: 'edit', notePath, card: fullCard, file: card.file };
	}

	function closeForm(): void {
		openRequest++;
		controller.cancelPendingWrites();
		form = null;
	}

	async function handleSave(payload: FlashcardFormSavePayload): Promise<boolean> {
		if (!form) return false;

		const saved =
			form.kind === 'create'
				? await controller.createCard(payload)
				: await controller.updateCard(form.card, payload);

		if (saved) closeForm();
		return saved;
	}

	function handleDelete(): void {
		if (form?.kind !== 'edit') return;
		controller.deleteCard(form.card);
		closeForm();
	}
</script>

<div class="ml-flashcard-sidebar">
	<!-- Head: which note, and the one action. Pinned, so the action never scrolls away.
	     While the form is open the form's own header replaces this one. -->
	{#if !form}
		<div class="ml-sidebar__head">
			{#if sidebarState.activeNote}
				<div class="ml-sidebar__source">
					<Icon name="file-text" size={16} />
					<div class="ml-sidebar__source-text">
						<h2 class="ml-sidebar__source-name">{sidebarState.activeNote.name}</h2>
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
				disabled={!sidebarState.activeNote}
				onclick={handleAdd}
			>
				{#snippet icon()}
					<Icon name="plus" size={14} />
				{/snippet}
				New card
			</Button>
		</div>
	{/if}

	<div class="ml-sidebar__body" class:ml-sidebar__body--form={form !== null}>
		{#if form}
			{#key form}
				<SidebarFlashcardForm
					mode={form.kind}
					card={form.kind === 'edit' ? form.card : undefined}
					prefillSource={form.kind === 'create' ? form.source : undefined}
					{contextLabel}
					label={form.kind === 'edit'
						? (sidebarState.previews[form.file] ?? 'this flashcard')
						: undefined}
					deckOptions={sidebarState.deckOptions}
					onClose={closeForm}
					onSave={handleSave}
					onDelete={form.kind === 'edit' ? handleDelete : undefined}
				/>
			{/key}
		{:else if sidebarState.activeNote === null}
			<!-- No active note: the head states it, and there is nothing to list. -->
		{:else if sidebarState.isLoading}
			<div class="ml-sidebar__loading" role="status" aria-label="Loading flashcards">
				<div class="ml-sidebar__skeleton-header" aria-hidden="true">
					<Skeleton shape="text" width="64px" height="12px" />
					<Skeleton shape="text" width="18px" height="12px" />
				</div>
				<div class="ml-sidebar__skeleton-cards" aria-hidden="true">
					{#each [0, 1, 2] as index (index)}
						<div class="ml-sidebar__skeleton-card">
							<div class="ml-sidebar__skeleton-meta">
								<Skeleton width="42px" height="18px" />
								<Skeleton width="56px" height="18px" />
								<Skeleton shape="text" width="72px" height="10px" />
							</div>
							<Skeleton shape="text" width="88%" height="12px" />
							<Skeleton shape="text" width="62%" height="12px" />
							<Skeleton width="54px" height="16px" />
						</div>
					{/each}
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
							<span class="ml-sidebar-group__label">{group.label}</span>
							<span class="ml-sidebar-group__count">{group.cards.length}</span>
							<Icon name="chevron-right" size={14} class="ml-sidebar-group__chevron" />
						</Collapsible.Trigger>
						<Collapsible.Content padding="none" divided={false} class="ml-sidebar-group__content">
							<div class="ml-sidebar-group__cards">
								<SidebarFlashcardList
									cards={group.cards}
									previews={sidebarState.previews}
									{hrefFor}
									onOpen={(card) => void handleEdit(card)}
								/>
							</div>
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
		gap: $spacing-sm;
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

	.ml-sidebar__body--form {
		padding: 0;
		overflow: hidden;
	}

	/* --- Status groups (quiet sticky sections) -------------------------- */

	.ml-sidebar__groups {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
		flex: none;
	}

	:global .ml-sidebar-group {
		border: none;
		border-radius: 0;
		background: none;
		overflow: visible;
	}

	/* The header is the whole control: a quiet section label, the count, and the
	   chevron. It sticks to the top while its cards scroll under it. The
	   element+class selector matches Obsidian's button rule specificity so the
	   header keeps its own chrome, not the form-button chrome. */
	:global(button.ml-sidebar-group__trigger.ml-collapsible__trigger) {
		position: sticky;
		top: 0;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: $spacing-xs;
		width: 100%;
		height: auto;
		min-height: 28px;
		margin: 0;
		padding: $spacing-xs 0;
		appearance: none;
		border-radius: 0;
		font-family: inherit;
		font-size: $font-xs;
		font-weight: $font-medium;
		letter-spacing: $letter-spacing-caps;
		line-height: 1.4;
		text-transform: uppercase;
		color: $text-muted;
		text-align: start;
		background-color: $background-secondary;
		border: none;
		border-bottom: 1px solid $background-modifier-border;
		box-shadow: none;
		cursor: pointer;
		transition:
			color $transition-fast,
			background-color $transition-fast;
	}

	:global(button.ml-sidebar-group__trigger.ml-collapsible__trigger:hover) {
		color: $text-normal;
	}

	:global(button.ml-sidebar-group__trigger.ml-collapsible__trigger:focus-visible) {
		outline: 2px solid $interactive-accent;
		outline-offset: -2px;
	}

	:global .ml-sidebar-group__label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global .ml-sidebar-group__count {
		flex: none;
		font-variant-numeric: tabular-nums;
		color: $text-faint;
	}

	:global .ml-sidebar-group__chevron {
		flex: none;
		margin-inline-start: auto;
		color: $text-faint;
		transition: transform $transition-fast;
	}

	:global .ml-sidebar-group[data-state='open'] .ml-sidebar-group__chevron {
		transform: rotate(90deg);
	}

	/* Stale is the one group that asks for attention. The cards carry the badge;
	   the header carries the warning ink. */
	:global .ml-sidebar-group--stale .ml-sidebar-group__label,
	:global .ml-sidebar-group--stale .ml-sidebar-group__count,
	:global .ml-sidebar-group--stale .ml-sidebar-group__chevron {
		color: $text-warning;
	}

	/* Padding, not margin: the group content is height-clipped for the
	   disclosure animation and measures its inner box. A collapsed margin
	   escapes that box, so the last card's border would be cut off. */
	.ml-sidebar-group__cards {
		padding-top: $spacing-xs;
	}

	/* --- States --------------------------------------------------------- */

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

	/* The skeleton mirrors the real composition: a quiet section header and the
	   Manage card shape, so nothing shifts when the list arrives. */
	.ml-sidebar__loading {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
	}

	.ml-sidebar__skeleton-header {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		padding: $spacing-xs 0;
		border-bottom: 1px solid $background-modifier-border;
	}

	.ml-sidebar__skeleton-cards {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
	}

	.ml-sidebar__skeleton-card {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		min-height: 116px;
		padding: $spacing-sm;
		background-color: $surface-raised;
		border: 1px solid $line-subtle;
		border-radius: $radius-md;
	}

	.ml-sidebar__skeleton-meta {
		display: flex;
		align-items: center;
		gap: $spacing-xxs;
	}

	/* ====================================================================
	   Coarse pointer — the only query the panel needs.
	   Hover does not exist on touch, so the sticky header grows to a target.
	   ==================================================================== */

	@media (hover: none) and (pointer: coarse) {
		:global(button.ml-sidebar-group__trigger.ml-collapsible__trigger) {
			min-height: 44px;
		}

		:global(button.ml-sidebar-group__trigger.ml-collapsible__trigger:hover) {
			background-color: transparent;
		}

		:global(button.ml-sidebar-group__trigger.ml-collapsible__trigger:active) {
			background-color: $background-modifier-active;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global .ml-sidebar-group__chevron,
		:global(button.ml-sidebar-group__trigger.ml-collapsible__trigger) {
			transition: none;
		}
	}
</style>
