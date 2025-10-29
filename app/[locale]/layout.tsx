import { NextIntlClientProvider } from 'next-intl';
import type {ReactNode} from 'react';

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const messages = (
    await import(`../../messages/${locale}.json`)
  ).default as Record<string, Record<string, string>>;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}