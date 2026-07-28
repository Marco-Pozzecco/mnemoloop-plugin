import { OpenDashboardCommand } from '@/modules/commands/palette/OpenDashboardCommand';
import { SetAllFlashcardsDueNowCommand } from '@/modules/commands/palette/SetAllFlashcardsDueNowCommand';
import { DebugAddTestFlashcardCommand } from '@/modules/commands/palette/DebugAddTestFlashcardsCommand';
import { CreateFlashcardModalCommand } from '@/modules/commands/palette/CreateFlashcardModalCommand';
import { CreateFlashcardFromFileModalCommand } from '@/modules/commands/file-menu/CreateFlashcardFromFileModalCommand';

export enum CommandKey {
	// palette
	openDashboard = 'openDashboard',
	setAllFlashcardsDueNow = 'setAllFlashcardsDueNow',
	debugAddTestFlashcards = 'debugAddTestFlashcards',
	createFlashcardModal = 'createFlashcardModal',
	// file menu
	createFlashcardFromFileModal = 'createFlashcardFromFileModal',
}

interface CommandMap {
	[CommandKey.openDashboard]: OpenDashboardCommand;
	[CommandKey.setAllFlashcardsDueNow]: SetAllFlashcardsDueNowCommand;
	[CommandKey.debugAddTestFlashcards]: DebugAddTestFlashcardCommand;
	[CommandKey.createFlashcardModal]: CreateFlashcardModalCommand;
	[CommandKey.createFlashcardFromFileModal]: CreateFlashcardFromFileModalCommand;
}

export type Commands = Map<CommandKey, CommandMap[CommandKey]>;
