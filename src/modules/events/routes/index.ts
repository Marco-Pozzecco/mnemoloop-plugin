import { EventRouter } from '../core/EventRouter';
import { FlashcardRouter } from './flashcard';
import { SettingsRouter } from './settings';
import { StatisticsRouter } from './statistics';
import { UIRouter } from './ui';
import { VaultRouter } from './vault';

const router = new EventRouter();

router.combine(FlashcardRouter, SettingsRouter, StatisticsRouter, VaultRouter, UIRouter);

export const IndexRouter = router;
