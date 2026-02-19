"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";

export default function CreatePasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [codeValid, setCodeValid] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  // Estados para gerenciar o reenvio
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [resendEmail, setResendEmail] = useState<string>("");
  const [resending, setResending] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<boolean>(false);

  useEffect(() => {
    const oobCode = searchParams.get("oobCode");
    if (!oobCode) {
      setError("Link inválido: código inexistente.");
      setLoading(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((userEmail) => {
        setEmail(userEmail || "");
        setCodeValid(true);
        setLoading(false);
      })
      .catch((err) => {
        // Verifica especificamente se o código expirou ou é inválido
        if (
          err.code === "auth/expired-action-code" ||
          err.code === "auth/invalid-action-code"
        ) {
          setIsExpired(true);
          setError("Este link expirou ou já foi utilizado.");
        } else {
          setError("Erro ao verificar o link de criação de senha.");
        }
        setCodeValid(false);
        setLoading(false);
      });
  }, [searchParams]);

  // Função para reenviar o link
  const handleResendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResending(true);
    setError("");

    try {
      const response = await fetch("/api/auth/resend-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resendEmail }),
      });

      if (!response.ok) {
        throw new Error("Erro ao reenviar");
      }

      setResendSuccess(true);
    } catch (err: any) {
      setError(
        "Não foi possível enviar o link. Verifique se o e-mail está correto.",
      );
    } finally {
      setResending(false);
    }
  };

  const validatePassword = (value: string) => {
    if (value.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    const oobCode = searchParams.get("oobCode");
    if (!oobCode) {
      setError("Código ausente no link.");
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
    } catch (err: any) {
      const message =
        err?.code === "auth/weak-password"
          ? "Senha muito fraca. Escolha uma senha mais forte."
          : err?.code === "auth/expired-action-code"
            ? "Este link expirou. Solicite um novo."
            : "Não foi possível definir sua senha. Tente novamente.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const goToLogin = () => {
    const lang = searchParams.get("lang") || "pt";
    const locale = lang.split("-")[0];
    router.push(`/${locale}/signin`);
  };

  const handleGoogleSignIn = async () => {
    const lang = searchParams.get("lang") || "pt";
    const locale = lang.split("-")[0];
    await signIn("google", { callbackUrl: `/${locale}/hub` });
  };

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-[600px] py-12 item-base">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">
            Definir sua senha
          </CardTitle>
          <CardDescription>
            Utilize o formulário abaixo para criar sua senha de acesso.
          </CardDescription>
        </CardHeader>

        <CardContent className="mt-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-10 w-full bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-10 w-full bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-10 w-full bg-slate-200 dark:bg-slate-800" />
            </div>
          ) : !codeValid ? (
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Formulário de reenvio se estiver expirado */}
              {isExpired && !resendSuccess && (
                <form onSubmit={handleResendLink} className="space-y-3 mt-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Insira seu e-mail abaixo para enviarmos um novo link de
                    acesso.
                  </p>
                  <Input
                    type="email"
                    placeholder="Seu e-mail cadastrado"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full" disabled={resending}>
                    {resending ? "Enviando..." : "Enviar novo link"}
                  </Button>
                </form>
              )}

              {/* Mensagem de sucesso ao reenviar */}
              {resendSuccess && (
                <Alert className="bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription>
                    Novo link enviado! Verifique sua caixa de entrada.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : success ? (
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-12 w-12" />
                <p className="font-medium">Senha definida com sucesso!</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Agora você já pode fazer login com sua nova senha.
              </p>
              <Button onClick={goToLogin} className="w-full">
                Ir para o login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {email && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md text-center">
                  Criando senha para:{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" isLoading={submitting} className="w-full">
                Definir senha
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-100 dark:bg-slate-900 text-gray-500">
                    ou
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                className="w-full"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="google"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 488 512"
                >
                  <path
                    fill="currentColor"
                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                  ></path>
                </svg>
                Entrar com Google
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
