export default interface HeaderProps {
  position: number;
  total: number;
  remaining: number;
  progress: number;
  onEndSession: () => void;
}
