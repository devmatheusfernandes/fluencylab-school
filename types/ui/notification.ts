export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date | string;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}
