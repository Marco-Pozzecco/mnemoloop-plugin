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

const router = new EventRouter();

router.route(VaultCreateEvent, FlashcardIndexOnVaultCreateHandler);
router.route(VaultModifyEvent, FlashcardIndexOnVaultModifyHandler);
router.route(VaultDeleteEvent, FlashcardIndexOnVaultDeleteHandler);
router.route(VaultRenameEvent, FlashcardIndexOnVaultRenameHandler);

export const VaultRouter = router;
