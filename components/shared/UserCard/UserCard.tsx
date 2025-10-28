"use client";

import * as React from "react";
import { twMerge } from "tailwind-merge";
import { UserRoles } from "@/types/users/userRoles";
import { roleLabels, capitalizeFirstLetter } from "@/utils/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogIn } from "lucide-react";

export interface UserData {
  name: string;
  role: string;
  avatar?: string;
}

export interface UserCardProps {
  user: UserData;
  isCollapsed?: boolean;
  variant?: "sidebar" | "mobile";
  className?: string;
  onLogout?: () => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  isCollapsed = false,
  variant = "sidebar",
  className,
  onLogout,
}) => {
  const userRoleLabel = user?.role
    ? roleLabels[user.role as UserRoles] || capitalizeFirstLetter(user.role)
    : "";

  if (variant === "mobile") {
    return (
      <div
        className={twMerge(
          "flex items-center gap-3 p-3 bg-surface rounded-lg",
          className
        )}
      >
        <Avatar size="xl">
          <AvatarImage size="xl" src={user.avatar || ""} alt="Usuário" />
          <AvatarFallback size="xl" name={user.name} />
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-title truncate">{user.name}</p>
          <p className="text-xs text-paragraph truncate">{userRoleLabel}</p>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-danger/20 text-danger hover:text-danger-light transition-colors"
            title="Sair"
          >
            <LogIn className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <div className={twMerge("relative group", className)}>
        <div className="flex items-center justify-center p-2">
          <Avatar size="sm">
            <AvatarImage size="sm" src={user.avatar || ""} alt="Usuário" />
            <AvatarFallback size="sm" name={user.name} />
          </Avatar>
        </div>
      </div>
    );
  }

  return (
    <div className={twMerge("flex items-center gap-3 p-3", className)}>
      <Avatar>
        <AvatarImage sizes="lg" src={user.avatar || ""} alt="Usuário" />
        <AvatarFallback size="lg" name={user.name} />
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-title truncate">{user.name}</p>
        <p className="text-xs text-paragraph truncate">{userRoleLabel}</p>
      </div>
      {onLogout && (
        <button
          onClick={onLogout}
          className="p-2 rounded-lg bg-danger/10 hover:bg-danger/20 text-danger hover:text-danger-light transition-all duration-300 ease-in-out"
          title="Sair"
        >
          <LogIn className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export { UserCard };
