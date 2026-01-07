"use client";

import * as React from "react";
import { twMerge } from "tailwind-merge";
import { UserRoles } from "@/types/users/userRoles";
import { capitalizeFirstLetter } from "@/utils/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogIn, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const tRoles = useTranslations("Roles");
  const userRoleLabel = user?.role ? tRoles(user.role) : "";

  if (variant === "mobile") {
    return (
      <div
        className={twMerge(
          "flex items-center gap-3 p-3 bg-surface rounded-lg",
          className
        )}
      >
        <Avatar size="xl">
          <AvatarImage src={user.avatar || ""} alt="Usuário" />
          <AvatarFallback name={user.name} />
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium title-base truncate">{user.name}</p>
          <p className="text-xs text-paragraph truncate">{userRoleLabel}</p>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2.5 rounded-sm bg-destructive/20 text-destructive hover:text-destructive transition-colors"
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
            <AvatarImage src={user.avatar || ""} alt="Usuário" />
            <AvatarFallback name={user.name} />
          </Avatar>
        </div>
      </div>
    );
  }

  return (
    <div className={twMerge("flex items-center gap-3 p-2.5", className)}>
      <Avatar size="md">
        <AvatarImage src={user.avatar || ""} alt="Usuário" />
        <AvatarFallback name={user.name} />
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium title-base truncate capitalize">{user.name.split(" ")[0]}</p>
        <p className="text-xs text-paragraph truncate">{userRoleLabel}</p>
      </div>
      {onLogout && (
        <button
          onClick={onLogout}
          className="p-2.5 rounded-sm bg-destructive/10 hover:bg-destructive/20 text-destructive hover:text-destructive transition-all duration-300 ease-in-out"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export { UserCard };
