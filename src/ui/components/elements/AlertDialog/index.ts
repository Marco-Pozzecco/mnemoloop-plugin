import AlertDialogAction from './Action/component.svelte';
import AlertDialogCancel from './Cancel/component.svelte';
import AlertDialogContent from './Content/component.svelte';
import AlertDialogDescription from './Description/component.svelte';
import AlertDialogFooter from './Footer/component.svelte';
import AlertDialogOverlay from './Overlay/component.svelte';
import AlertDialogPortal from './Portal/component.svelte';
import AlertDialogRoot from './Root/component.svelte';
import AlertDialogTitle from './Title/component.svelte';
import AlertDialogTrigger from './Trigger/component.svelte';

/**
 * Compound alert dialog component built on bits-ui `AlertDialog`.
 *
 * Usage:
 * ```svelte
 * <script lang="ts">
 * 	let open = $state(false);
 *
 * 	function handleOpenChange(nextOpen: boolean): void {
 * 		open = nextOpen;
 * 	}
 *
 * 	function handleConfirm(): void {
 * 		// Delete the item, then close the dialog if needed.
 * 	}
 * </script>
 *
 * <AlertDialog.Root bind:open onOpenChange={handleOpenChange}>
 * 	<AlertDialog.Trigger>Delete item</AlertDialog.Trigger>
 * 	<AlertDialog.Portal>
 * 		<AlertDialog.Overlay />
 * 		<AlertDialog.Content interactOutsideBehavior="ignore">
 * 			<AlertDialog.Title level={3}>Delete item?</AlertDialog.Title>
 * 			<AlertDialog.Description>This action cannot be undone.</AlertDialog.Description>
 * 			<AlertDialog.Footer>
 * 				<AlertDialog.Cancel>Cancel<AlertDialog.Cancel>
 * 				<AlertDialog.Action onclick={handleConfirm}>Delete item</AlertDialog.Action>
 * 			</AlertDialog.Footer>
 * 		</AlertDialog.Content>
 * 	</AlertDialog.Portal>
 * </AlertDialog.Root>
 * ```
 *
 * `Root` owns the open state. Use `bind:open` for controlled state and optionally
 * handle `onOpenChange` or `onOpenChangeComplete`. `Portal` keeps content inline by
 * default for server-rendered dialogs; set `disabled={false}` to portal it.
 *
 * Sub-components:
 * - `Root` — dialog state and lifecycle callbacks; `open` defaults to `false`.
 * - `Trigger` — opens the dialog from a consumer-provided trigger element.
 * - `Portal` — groups dialog content and optionally portals it to the body or `to` target.
 * - `Overlay` — the modal backdrop.
 * - `Content` — the dialog panel; forwards bits-ui props such as `interactOutsideBehavior`.
 * - `Title` — the accessible dialog title.
 * - `Description` — the accessible dialog description.
 * - `Footer` — the actions container.
 * - `Action` — the confirm action; use its `child` snippet to provide a custom button.
 * - `Cancel` — the cancel action; use its `child` snippet to provide a custom button.
 *
 * `Trigger`, `Overlay`, `Content`, `Title`, `Description`, `Action`, and `Cancel` forward
 * their remaining bits-ui props and accept `class`; `Root` and `Portal` expose their documented
 * state and portal props.
 */
export default {
	Root: AlertDialogRoot,
	Trigger: AlertDialogTrigger,
	Portal: AlertDialogPortal,
	Overlay: AlertDialogOverlay,
	Content: AlertDialogContent,
	Footer: AlertDialogFooter,
	Title: AlertDialogTitle,
	Description: AlertDialogDescription,
	Action: AlertDialogAction,
	Cancel: AlertDialogCancel,
};
