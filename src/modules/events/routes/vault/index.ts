import { EventRouter } from '../../core/EventRouter';
import {
	VaultCreateEvent,
	VaultDeleteEvent,
	VaultModifyEvent,
	VaultRenameEvent,
} from '../../domains/vault';
import {
	FlashcardIndexCreateHandler,
	FlashcardIndexDeleteHandler,
	FlashcardIndexModifyHandler,
	FlashcardIndexRenameHandler,
} from '../../handlers/flashcard/indexer';

const router = new EventRouter();

router.route(VaultCreateEvent, FlashcardIndexCreateHandler);
router.route(VaultModifyEvent, FlashcardIndexModifyHandler);
router.route(VaultDeleteEvent, FlashcardIndexDeleteHandler);
router.route(VaultRenameEvent, FlashcardIndexRenameHandler);

export const VaultRouter = router;
