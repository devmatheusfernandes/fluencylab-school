import * as React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useUserProfile } from "@/hooks/user/useUserProfile";
import { AvatarProps, useChatContext } from "stream-chat-react";


export function UserAvatarBubble(props: AvatarProps) {
    const { user } = props;
    const { client } = useChatContext();
    const { userProfile } = useUserProfile(user?.id);

    // Não mostra o avatar se for o próprio usuário (mensagens enviadas)
    if (user?.id === client.userID) {
        return null;
    }

  return (
    <Avatar size="sm">
      <AvatarImage
        src={userProfile?.avatarUrl || user?.image || ""}
        alt={userProfile?.name || user?.name || "User avatar"}
        className="self-center align-center"

      />
      <AvatarFallback name={userProfile?.name || user?.name || undefined} />
    </Avatar>
  )
}
