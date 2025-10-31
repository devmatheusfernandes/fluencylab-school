import React from "react";

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  isActive = false,
  children,
  title,
  disabled = false,
}) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`
      p-2 rounded-lg transition-all duration-200 
      ${
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-foreground hover:bg-accent hover:text-accent-foreground"
      }
      disabled:opacity-40 disabled:cursor-not-allowed
      active:scale-95
    `}
  >
    {children}
  </button>
);

export default ToolbarButton;
export type { ToolbarButtonProps };