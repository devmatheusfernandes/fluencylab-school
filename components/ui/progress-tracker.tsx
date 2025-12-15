import * as React from "react";
import { twMerge } from "tailwind-merge";

export interface ProgressTrackerProps {
  /**
   * The type of progress display.
   * @default 'linear'
   */
  variant?: "linear" | "circular" | "steps";
  /**
   * The current progress value (0-100).
   * @default 0
   */
  value: number;
  /**
   * The maximum value for the progress.
   * @default 100
   */
  max?: number;
  /**
   * The size of the progress tracker.
   * @default 'base'
   */
  size?: "sm" | "base" | "lg";
  /**
   * Custom CSS classes to apply to the progress tracker.
   */
  className?: string;
  /**
   * Whether to show the progress percentage.
   * @default false
   */
  showPercentage?: boolean;
  /**
   * The color variant of the progress tracker.
   * @default 'primary'
   */
  color?: "primary" | "secondary" | "success" | "warning" | "danger";
  /**
   * Whether to show an animated progress bar.
   * @default true
   */
  animated?: boolean;
  /**
   * For steps variant, the total number of steps.
   */
  totalSteps?: number;
  /**
   * For steps variant, the current step.
   */
  currentStep?: number;
}

const ProgressTracker = React.forwardRef<HTMLDivElement, ProgressTrackerProps>(
  (
    {
      variant = "linear",
      value,
      max = 100,
      size = "base",
      className,
      showPercentage = false,
      color = "primary",
      animated = true,
      totalSteps,
      currentStep,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeClasses = {
      sm: "h-2",
      base: "h-3",
      lg: "h-4",
    };

    const colorClasses = {
      primary: "bg-primary",
      secondary: "bg-secondary",
      success: "bg-success",
      warning: "bg-warning",
      danger: "bg-danger",
    };

    const renderLinear = () => (
      <div className="w-full">
        <div
          className={twMerge(
            "relative rounded-full overflow-hidden",
            sizeClasses[size]
          )}
        >
          <div
            className={twMerge(
              "h-full rounded-full transition-all duration-500 ease-out",
              colorClasses[color],
              animated && "animate-pulse"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showPercentage && (
          <div className="mt-2 text-sm text-paragraph text-center">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    );

    const renderCircular = () => {
      const radius = size === "sm" ? 20 : size === "base" ? 30 : 40;
      const strokeWidth = size === "sm" ? 4 : size === "base" ? 6 : 8;
      const circumference = 2 * Math.PI * radius;
      const strokeDasharray = circumference;
      const strokeDashoffset =
        circumference - (percentage / 100) * circumference;

      return (
        <div className="flex flex-col items-center">
          <div className="relative">
            <svg
              className={twMerge(
                "transform -rotate-90",
                size === "sm"
                  ? "w-16 h-16"
                  : size === "base"
                    ? "w-24 h-24"
                    : "w-32 h-32"
              )}
            >
              {/* Background circle */}
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="transparent"
                className="text-surface-2"
              />
              {/* Progress circle */}
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={twMerge(
                  "transition-all duration-500 ease-out",
                  colorClasses[color]
                )}
              />
            </svg>
            {showPercentage && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={twMerge(
                    "font-semibold text-paragraph",
                    size === "sm"
                      ? "text-xs"
                      : size === "base"
                        ? "text-sm"
                        : "text-base"
                  )}
                >
                  {Math.round(percentage)}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    };

    const renderSteps = () => {
      const steps = totalSteps || 5;
      const current = currentStep || Math.ceil((percentage / 100) * steps);

      return (
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-paragraph">
              Passo {current} de {steps}
            </span>
            {showPercentage && (
              <span className="text-sm text-paragraph">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            {Array.from({ length: steps }, (_, index) => (
              <div
                key={index}
                className={twMerge(
                  "flex-1 h-2 rounded-full transition-all duration-300",
                  index < current ? colorClasses[color] : "bg-surface-2"
                )}
              />
            ))}
          </div>
        </div>
      );
    };

    const renderProgress = () => {
      switch (variant) {
        case "circular":
          return renderCircular();
        case "steps":
          return renderSteps();
        default:
          return renderLinear();
      }
    };

    return (
      <div ref={ref} className={twMerge("w-full", className)} {...props}>
        {renderProgress()}
      </div>
    );
  }
);

ProgressTracker.displayName = "ProgressTracker";

export { ProgressTracker };
