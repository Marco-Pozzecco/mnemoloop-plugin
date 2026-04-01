import { Indexes } from '@/types/indexes';

export interface AppProps {
	indexes: Indexes;
}

export type AppViews = 'dashboard' | 'review';
