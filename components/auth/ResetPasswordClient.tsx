"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('ResetPassword');

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
      setError(t('invalidLink'));
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
        setError(t('invalidLink'));
        setCodeValid(false);
        setLoading(false);
      });
  }, [searchParams, t]);

  const validatePassword = (value: string) => {
    if (value.length < 8) return t('weakPassword');
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
      setError(t('passwordMismatch'));
      return;
    }
    const oobCode = searchParams.get('oobCode');
    if (!oobCode) {
      setError(t('invalidLink'));
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      const message =
        err?.code === 'auth/weak-password'
          ? t('weakPassword')
          : err?.code === 'auth/expired-action-code'
          ? t('invalidLink')
          : t('error');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const goToLogin = () => {
    router.push(`/${locale}/signin`);
  };

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader className='text-center space-y-2'>
          <CardTitle className='text-2xl font-bold'>{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>

        <CardContent className='mt-4'>
          {loading ? (
            <div className="space-y-4">
               <Skeleton className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800" />
               <Skeleton className="h-10 w-full bg-slate-200 dark:bg-slate-800" />
               <Skeleton className="h-10 w-full bg-slate-200 dark:bg-slate-800" />
               <Skeleton className="h-10 w-full bg-slate-200 dark:bg-slate-800" />
            </div>
          ) : !codeValid ? (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error || t('invalidLink')}
                </AlertDescription>
             </Alert>
          ) : success ? (
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-12 w-12" />
                <p className="font-medium">{t('successTitle')}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('successDesc')}
              </p>
              <Button onClick={goToLogin} className="w-full">
                {t('backToLogin')}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {email && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md text-center">
                  <span className="font-medium text-foreground">{email}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">{t('newPassword')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('placeholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">{t('confirmPassword')}</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={t('placeholderConfirm')}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                   <AlertCircle className="h-4 w-4" />
                   <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full"
              >
                {submitting ? t('loading') : t('submit')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
