export default async function SignInPage({
  params
}: {
  params: Promise<{locale: string}>
}) {
  const {locale} = await params;
  const messages = (await import(`../../../../messages/${locale}.json`)).default as any;
  const t = (key: string) => messages?.Auth?.[key] ?? key;

  return (
    <div className="w-full max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold text-center">{t('signin')}</h1>
      <form className="space-y-3">
        <label className="block text-sm font-medium">{t('email')}</label>
        <input type="email" className="w-full border rounded px-3 py-2" />

        <label className="block text-sm font-medium">{t('password')}</label>
        <input type="password" className="w-full border rounded px-3 py-2" />

        <button type="submit" className="w-full bg-primary text-primary-foreground rounded px-3 py-2">
          {t('submit')}
        </button>
      </form>
    </div>
  );
}