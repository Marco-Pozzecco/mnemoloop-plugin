import { Event } from '../../core/Event';

export type NoData = void;

const t = {
	open: 'Dashboard:Open',
} as const;

export class DashboardOpenEvent extends Event<NoData> {
	constructor() {
		super(t.open);
	}
}
