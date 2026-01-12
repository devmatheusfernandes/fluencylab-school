"use client";

import React, { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types/users/users";
import { useAvatar } from "@/hooks/useAvatar";
import { LogOut, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface UserProfileHeaderProps {
  user: User;
  onLogout: () => void;
  className?: string;
  onAvatarUpdate?: (avatarUrl: string) => void;
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  user,
  onLogout,
  className = "",
  onAvatarUpdate,
}) => {
  const t = useTranslations("UserProfileHeader");
  const tRoles = useTranslations("Roles");
  const { uploadAvatar, isUploading } = useAvatar(user?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userRoleLabel = user?.role ? tRoles(user.role) : "";

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const newAvatarUrl = await uploadAvatar(file);
      if (newAvatarUrl && onAvatarUpdate) {
        onAvatarUpdate(newAvatarUrl);
      }
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Card>
      <div
        className={`flex flex-row justify-between items-center ${className}`}
      >
        <div className="flex flex-row items-center sm:items-start gap-2">
          <div className="relative">
            <Avatar size="xl">
              <AvatarImage
                src={user?.avatarUrl || ""}
                alt={user?.name || t("profilePicture")}
              />
              <AvatarFallback />
            </Avatar>
            <button
              onClick={handleAvatarClick}
              disabled={isUploading}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors shadow-md disabled:opacity-50"
              title={t("changeProfilePicture")}
            >
              {isUploading ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
            </button>
          </div>
          <div className="flex flex-col items-start mt-0 sm:mt-2">
            <Text weight="semibold" className="capitalize">{user?.name || ""}</Text>
            <Text variant="placeholder" size="xs">
              {user?.email || ""}
            </Text>
            <Badge className="my-1">{userRoleLabel}</Badge>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="p-2.5 rounded-lg h-fit bg-destructive/20 hover:bg-destructive/30 text-destructive hover:text-red-500 transition-colors"
          title={t("logout")}
        >
          <LogOut className="w-4 h-4" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          disabled={isUploading}
        />
      </div>
    </Card>
  );
};

export default UserProfileHeader;
