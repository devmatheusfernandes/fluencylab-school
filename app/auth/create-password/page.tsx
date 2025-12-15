'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export default function CreatePasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [codeValid, setCodeValid] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    const oobCode = searchParams.get('oobCode');
    if (!oobCode) {
      setError('Link inválido: código inexistente.');
      setLoading(false);
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then((userEmail) => {
        setEmail(userEmail || '');
        setCodeValid(true);
        setLoading(false);
      })
      .catch(() => {
        setError('Este link de criação de senha é inválido ou expirou.');
        setCodeValid(false);
        setLoading(false);
      });
  }, [searchParams]);

  const validatePassword = (value: string) => {
    if (value.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (password !== confirm) {
      setError('As senhas não conferem.');
      return;
    }
    const oobCode = searchParams.get('oobCode');
    if (!oobCode) {
      setError('Código ausente no link.');
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
    } catch (err: any) {
      const message =
        err?.code === 'auth/weak-password'
          ? 'Senha muito fraca. Escolha uma senha mais forte.'
          : err?.code === 'auth/expired-action-code'
          ? 'Este link expirou. Solicite um novo.'
          : 'Não foi possível definir sua senha. Tente novamente.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const goToLogin = () => {
    const lang = searchParams.get('lang') || 'pt-BR';
    router.push(`/${lang}/(auth)/signin`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-6">
      <div className="w-full max-w-md card-base p-6">
        <h1 className="title-base mb-2">Definir sua senha</h1>
        <p className="paragraph-base mb-6">
          Utilize o formulário abaixo para criar sua senha de acesso.
        </p>

        {loading && (
          <div className="skeleton-sub h-8 rounded-md" />
        )}

        {!loading && !codeValid && (
          <div className="text-red-600 dark:text-red-400 mb-4">
            {error || 'Link inválido.'}
          </div>
        )}

        {!loading && codeValid && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {email && (
              <div className="paragraph-base">
                Criando senha para: <span className="font-semibold">{email}</span>
              </div>
            )}

            <div>
              <label className="paragraph-base mb-1 block">Nova senha</label>
              <input
                type="password"
                className="w-full input-base px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 8 caracteres"
                required
              />
            </div>

            <div>
              <label className="paragraph-base mb-1 block">Confirmar senha</label>
              <input
                type="password"
                className="w-full input-base px-3 py-2"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repita a senha"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 dark:text-red-400">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-primary text-primary-foreground py-2 font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : 'Definir senha'}
            </button>
          </form>
        )}

        {success && (
          <div className="space-y-4">
            <div className="text-green-700 dark:text-green-400">
              Senha definida com sucesso. Agora você já pode fazer login.
            </div>
            <button
              onClick={goToLogin}
              className="w-full rounded-lg bg-primary text-primary-foreground py-2 font-semibold hover:opacity-90"
            >
              Ir para o login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

