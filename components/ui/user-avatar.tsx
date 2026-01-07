import * as React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface UserAvatarProps extends React.ComponentProps<typeof Avatar> {
  src?: string | null
  name?: string | null
  alt?: string
  fallback?: React.ReactNode
}

export function UserAvatar({ 
  src, 
  name, 
  alt, 
  fallback, 
  className, 
  size = "md",
  ...props 
}: UserAvatarProps) {
  return (
    <Avatar size={size} className={className} {...props}>
      <AvatarImage
        src={src || ""}
        alt={alt || name || "User avatar"}
      />
      <AvatarFallback className="" name={name || undefined}>
        {fallback}
      </AvatarFallback>
    </Avatar>
  )
}
