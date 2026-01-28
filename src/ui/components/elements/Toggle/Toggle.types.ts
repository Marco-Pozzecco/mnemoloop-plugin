
export interface ToggleProps {
  id?: string;
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  helperText?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onchange?: (checked: boolean) => void;
}
