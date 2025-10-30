import { ShieldAlertIcon } from "lucide-react";
import React from "react";

interface ErrorAlertProps {
  message: string | null;
  className?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, className = "" }) => {
  if (!message) return null;

  return (
    <div className={`flex justify-center items-center h-64 ${className}`}>
      <div
        role="alert"
        className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-400/20 text-red-700 px-5 py-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300"
      >
        <ShieldAlertIcon className="w-5 h-5 text-red-600 shrink-0" />
        <div className="flex flex-col">
          <span className="font-semibold">Ops! Algo deu errado...</span>
          <span className="text-sm">{message}</span>
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;
