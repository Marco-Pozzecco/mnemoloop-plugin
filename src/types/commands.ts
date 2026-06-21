import { OpenDashboardCommand } from '@/modules/commands/palette/OpenDashboardCommand';
import { CreateEmptyFlashcardCommand } from '@/modules/commands/palette/CreateEmptyFlashcardCommand';
import { SetAllFlashcardsDueNowCommand } from '@/modules/commands/palette/SetAllFlashcardsDueNowCommand';
import { DebugAddTestFlashcardCommand } from '@/modules/commands/palette/DebugAddTestFlashcardsCommand';
import { GenerateFromSelectionCommand } from '@/modules/commands/editor-menu/GenerateFromSelectionCommand';
import { AIGenerateFromFileCommand } from '@/modules/commands/file-menu/AIGenerateFromFileCommand';
import { CreateFlashcardFromFileCommand } from '@/modules/commands';

export enum CommandKey {
	// palette
	openDashboard = 'openDashboard',
	createEmptyFlashcard = 'createEmptyFlashcard',
	setAllFlashcardsDueNow = 'setAllFlashcardsDueNow',
	debugAddTestFlashcards = 'debugAddTestFlashcards',
	// file menu
	generateFromFile = 'generateFromFile',
	createFlashcardFromFile = 'createFlashcardFromFile',
	// editor menu
	generateFromSelection = 'generateFromSelection',
}

interface CommandMap {
	[CommandKey.openDashboard]: OpenDashboardCommand;
	[CommandKey.createEmptyFlashcard]: CreateEmptyFlashcardCommand;
	[CommandKey.setAllFlashcardsDueNow]: SetAllFlashcardsDueNowCommand;
	[CommandKey.debugAddTestFlashcards]: DebugAddTestFlashcardCommand;
	[CommandKey.generateFromSelection]: GenerateFromSelectionCommand;
	[CommandKey.generateFromFile]: AIGenerateFromFileCommand;
	[CommandKey.createFlashcardFromFile]: CreateFlashcardFromFileCommand;
}

export type Commands = Map<CommandKey, CommandMap[CommandKey]>;
