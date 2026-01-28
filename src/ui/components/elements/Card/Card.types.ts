import { MouseEventHandler } from "svelte/elements";

export interface CardProps {
  title?: string;
  hasBorder?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  icon?: string;
  clickable?: boolean;
  className?: string;
  onClick?: () => void;
}
