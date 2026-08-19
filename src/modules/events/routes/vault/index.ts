import { EventRouter } from '../../core/EventRouter';
import {
	VaultCreateEvent,
	VaultDeleteEvent,
	VaultModifyEvent,
	VaultRenameEvent,
} from '../../domains/vault';
import {
	FlashcardIndexOnVaultCreateHandler,
	FlashcardIndexOnVaultDeleteHandler,
	FlashcardIndexOnVaultModifyHandler,
	FlashcardIndexOnVaultRenameHandler,
} from '../../handlers/flashcard/indexer';
import { FlashcardStaleOnSourceNoteModifyHandler } from '../../handlers/flashcard/source-stale';

const router = new EventRouter();

router.route(VaultCreateEvent, FlashcardIndexOnVaultCreateHandler);
router.route(VaultModifyEvent, FlashcardStaleOnSourceNoteModifyHandler);
router.route(VaultModifyEvent, FlashcardIndexOnVaultModifyHandler);
router.route(VaultDeleteEvent, FlashcardIndexOnVaultDeleteHandler);
router.route(VaultRenameEvent, FlashcardIndexOnVaultRenameHandler);

export const VaultRouter = router;
