import { AppViews } from '@/ui/views/App/types';

export type NavTab = 'dashboard' | 'manage' | 'analytics';

export default interface NavbarProps {
	activeTab?: AppViews;
	onTabChange?: (tab: AppViews) => void;
	className?: string;
}
