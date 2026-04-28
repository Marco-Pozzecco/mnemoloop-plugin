export default interface SliderProps {
  id?: string;
  label?: string;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  required?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  helperText?: string;
  className?: string;
  onchange?: (value: number) => void;
}
