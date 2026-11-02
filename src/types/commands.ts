import { OpenDashboardCommand } from '@/modules/commands/palette/OpenDashboardCommand';
import { OpenFlashcardSidebarCommand } from '@/modules/commands/palette/OpenFlashcardSidebarCommand';
import { SetAllFlashcardsDueNowCommand } from '@/modules/commands/palette/SetAllFlashcardsDueNowCommand';
import { DebugAddTestFlashcardCommand } from '@/modules/commands/palette/DebugAddTestFlashcardsCommand';
import { CreateFlashcardFromFileCommand } from '@/modules/commands/file-menu/CreateFlashcardFromFileCommand';

export enum CommandKey {
	// palette
	openDashboard = 'openDashboard',
	openFlashcardSidebar = 'openFlashcardSidebar',
	setAllFlashcardsDueNow = 'setAllFlashcardsDueNow',
	debugAddTestFlashcards = 'debugAddTestFlashcards',
	// file menu
	createFlashcardFromFile = 'createFlashcardFromFile',
}

interface CommandMap {
	[CommandKey.openDashboard]: OpenDashboardCommand;
	[CommandKey.openFlashcardSidebar]: OpenFlashcardSidebarCommand;
	[CommandKey.setAllFlashcardsDueNow]: SetAllFlashcardsDueNowCommand;
	[CommandKey.debugAddTestFlashcards]: DebugAddTestFlashcardCommand;
	[CommandKey.createFlashcardFromFile]: CreateFlashcardFromFileCommand;
}

export type Commands = Map<CommandKey, CommandMap[CommandKey]>;
