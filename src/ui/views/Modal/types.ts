import { ModalController } from '@/ui/controllers/ModalController';
import { App, Component } from 'obsidian';

export interface ModalProps {
	controller: ModalController;
	app: App;
	component: Component;
}

export enum ModalClassNames {
	flashcard = 'ka-flashcard-modal',
}
