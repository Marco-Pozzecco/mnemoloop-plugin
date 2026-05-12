import { Event } from '../../core/Event';

export type NoData = undefined;

export class DashboardOpenEvent extends Event<NoData> {
	static readonly type = 'Dashboard:Open';

	constructor() {
		super(DashboardOpenEvent.type, undefined);
	}
}
