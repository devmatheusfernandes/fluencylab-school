import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      permissions?: string[];
      tutorialCompleted?: boolean;
      twoFactorEnabled?: boolean;
      hasPassword?: boolean;
      avatarUrl?: string | null;
      preferences?: {
        soundEffectsEnabled?: boolean;
        [key: string]: any;
      };
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    permissions?: string[];
    tutorialCompleted?: boolean;
    twoFactorEnabled?: boolean;
    hasPassword?: boolean;
    languages?: string[];
    avatarUrl?: string | null;
    preferences?: {
      soundEffectsEnabled?: boolean;
      [key: string]: any;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    permissions?: string[];
    tutorialCompleted?: boolean;
    twoFactorEnabled?: boolean;
    hasPassword?: boolean;
    preferences?: {
      soundEffectsEnabled?: boolean;
      [key: string]: any;
    };
  }
}
