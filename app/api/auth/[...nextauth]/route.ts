import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { AuthService } from "@/services/core/authService";
import { adminDb } from "@/lib/firebase/admin";

const authService = new AuthService();

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        twoFactorCode: {
          label: "2FA Code",
          type: "text",
          placeholder: "000000",
        },
      },
      async authorize(credentials) {
        try {
          // Log de depuração seguro
          //console.log(`[NextAuth] Iniciando autorização...`);

          if (!credentials?.email || !credentials?.password) {
            //console.log(`[NextAuth] Credenciais incompletas`);
            return null;
          }

          //console.log(`[NextAuth] Validando usuário...`);
          const user = await authService.validateUser(
            credentials.email,
            credentials.password
          );
          if (!user) {
            // console.log(
            //   `[NextAuth] Usuário não encontrado ou credenciais inválidas`
            // );
            return null;
          }

          // console.log(
          //   `[NextAuth] Usuário validado. 2FA habilitado: ${user.twoFactorEnabled}`
          // );

          // If 2FA is enabled, we need to verify the 2FA code
          if (user.twoFactorEnabled) {
            // Check if 2FA code is provided
            if (!credentials.twoFactorCode) {
              //console.log(`[NextAuth] 2FA habilitado mas código não fornecido`);
              // Return a special response indicating 2FA is required
              throw new Error("2FA_REQUIRED");
            }

            // console.log(
            //   `[NextAuth] Verificando código 2FA...`
            // );

            // Verify the 2FA token
            const isValid = await authService.verifyTwoFactorToken(
              user.id,
              credentials.twoFactorCode
            );
            if (!isValid) {
              // console.log(
              //   `[NextAuth] Token 2FA inválido, tentando código de backup...`
              // );
              // Try to verify as backup code
              const isBackupValid = await authService.verifyBackupCode(
                user.id,
                credentials.twoFactorCode
              );
              if (isBackupValid) {
                // console.log(
                //   `[NextAuth] Código de backup válido, invalidando...`
                // );
                // Invalidate the used backup code
                await authService.invalidateBackupCode(
                  user.id,
                  credentials.twoFactorCode
                );
              } else {
                //console.log(`[NextAuth] Código de backup também inválido`);
                throw new Error("Invalid 2FA code");
              }
            } else {
              //console.log(`[NextAuth] Token 2FA válido`);
            }
          }

          // console.log(
          //   `[NextAuth] Autorização bem-sucedida`
          // );
          return user;
        } catch (error) {
          //console.error(`[NextAuth] Erro na autorização:`, error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.callback-url"
          : "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-next-auth.csrf-token"
          : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        try {
          // Check if user exists in Firestore
          const usersRef = adminDb.collection("users");
          const snapshot = await usersRef
            .where("email", "==", profile.email)
            .limit(1)
            .get();

          if (snapshot.empty) {
            return false; // Block login if user not found
          }

          // Sync Google profile picture if user has no avatar
          const userDoc = snapshot.docs[0];
          const userData = userDoc.data();
          
          // Google profile usually has 'picture' field
          // We use 'as any' or check specifically if using typed profile
          const googlePicture = (profile as any)?.picture;

          if (!userData.avatarUrl && googlePicture) {
            try {
              await userDoc.ref.update({
                avatarUrl: googlePicture,
              });
            } catch (error) {
              console.error("Error syncing Google avatar:", error);
              // Non-blocking error, continue login
            }
          }

          return true;
        } catch (error) {
          console.error("Error verifying Google user:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (account && user) {
        if (account.provider === "google") {
          // Find Firestore user to get the correct ID (Firebase UID)
          const usersRef = adminDb.collection("users");
          const snapshot = await usersRef
            .where("email", "==", user.email)
            .limit(1)
            .get();

          if (!snapshot.empty) {
            const firestoreUser = snapshot.docs[0].data();
            token.id = snapshot.docs[0].id; // Use Firestore ID (Firebase UID)
            token.role = firestoreUser.role;
            token.permissions = firestoreUser.permissions;
            token.tutorialCompleted = firestoreUser.tutorialCompleted;
            token.twoFactorEnabled = firestoreUser.twoFactorEnabled;
            token.preferences = firestoreUser.preferences;

            // Fetch hasPassword status
            const fullUser = await authService.getUserById(token.id as string);
            token.hasPassword = fullUser?.hasPassword;
          }
        } else {
          token.id = user.id;
          token.role = user.role;
          token.permissions = user.permissions;
          token.tutorialCompleted = user.tutorialCompleted;
          token.twoFactorEnabled = user.twoFactorEnabled;
          token.hasPassword = user.hasPassword;
          token.preferences = user.preferences;
        }
      }

      // Refresh user data from database when session is updated or periodically
      if (trigger === "update" || (!user && token.id)) {
        try {
          const refreshedUser = await authService.getUserById(
            token.id as string
          );
          if (refreshedUser) {
            token.role = refreshedUser.role;
            token.permissions = refreshedUser.permissions;
            token.tutorialCompleted = refreshedUser.tutorialCompleted;
            token.twoFactorEnabled = refreshedUser.twoFactorEnabled;
            token.hasPassword = refreshedUser.hasPassword;
            token.preferences = refreshedUser.preferences;
          }
        } catch (error) {
          console.error("Error refreshing user data in JWT callback:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions as string[];
        session.user.tutorialCompleted = token.tutorialCompleted as boolean;
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
        session.user.hasPassword = token.hasPassword as boolean;
        session.user.preferences = token.preferences as any;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin", // Redirect to signin page on error
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
