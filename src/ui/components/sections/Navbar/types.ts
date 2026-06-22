export type NavTab = 'dashboard' | 'analytics';

export default interface NavbarProps {
	activeTab?: NavTab;
	onTabChange?: (tab: NavTab) => void;
	className?: string;
}
