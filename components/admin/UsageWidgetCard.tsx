"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export type WidgetStatus = 
  | "connected" 
  | "error" 
  | "warning" 
  | "loading" 
  | "info"
  | "restricted";

interface UsageWidgetCardProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  status: WidgetStatus;
  statusText?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  action?: ReactNode;
}

export default function UsageWidgetCard({
  title,
  subtitle,
  icon,
  status,
  statusText,
  children,
  footer,
  className,
  action,
}: UsageWidgetCardProps) {
  
  const getStatusBadge = () => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-none shadow-none">
            <CheckCircle2 className="w-3 h-3 mr-1.5" />
            {statusText || "Online"}
          </Badge>
        );
      case "loading":
        return (
          <Badge variant="outline" className="text-muted-foreground border-muted">
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            {statusText || "Verifying..."}
          </Badge>
        );
      case "warning":
      case "restricted":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 border-none shadow-none">
            <Info className="w-3 h-3 mr-1.5" />
            {statusText || "Warning"}
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-none shadow-none">
            <AlertCircle className="w-3 h-3 mr-1.5" />
            {statusText || "Error"}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {statusText || status}
          </Badge>
        );
    }
  };

  const getStatusBorder = () => {
    switch (status) {
      case "error":
        return "border-red-200 dark:border-red-900/50";
      case "warning":
      case "restricted":
        return "border-amber-200 dark:border-amber-900/50";
      default:
        return "border-border/40";
    }
  };

  return (
    <Card className={cn(
      "flex flex-col h-full overflow-hidden transition-all duration-200 hover:shadow-md", 
      getStatusBorder(),
      className
    )}>
      {/* Header */}
      <div className="p-5 flex items-start justify-between border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl transition-colors",
            status === 'error' ? "bg-red-100 text-red-600 dark:bg-red-900/20" :
            status === 'warning' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20" :
            "bg-background border border-border/60 text-primary shadow-sm"
          )}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-base leading-none tracking-tight">{title}</h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {action}
          {getStatusBadge()}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="p-4 bg-muted/10 border-t border-border/40 text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </Card>
  );
}
