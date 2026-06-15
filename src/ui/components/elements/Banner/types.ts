export type BannerView = 'dashboard' | 'review';

export interface BannerConfig {
	id: string;
	view: BannerView;
	message: string;
	link?: { label: string; url: string };
	icon?: string;
}

export default interface BannerProps {
	banner: BannerConfig;
	onDismiss: () => void;
}
