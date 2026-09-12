export interface StatusConfig {
  labelKey: string;
  ariaLabelKey: string;
  indicatorClassName: string;
  iconClassName: string;
  iconKey: "add" | "clock" | "check" | "x" | "undo";
}

export interface DropZone {
  id: string;
  label: string;
  iconPath: React.ReactNode;
  className: string;
}
