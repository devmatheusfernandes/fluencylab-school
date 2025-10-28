'use client';
import {usePathname, useRouter} from 'next/navigation';
import {useLocale} from 'next-intl';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function setLocale(nextLocale: string) {
    const segments = pathname.split('/');
    // path starts with '/' so first segment is ''
    if (segments.length > 1) {
      segments[1] = nextLocale;
    }
    router.push(segments.join('/'));
  }

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value)}
      className="absolute top-4 right-4 border rounded px-2 py-1 bg-white"
    >
      <option value="en">English</option>
      <option value="pt">Português</option>
    </select>
  );
}