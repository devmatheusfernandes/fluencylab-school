import ChatWidget from '@/components/chat/ChatWidget';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata.Chat' });
 
  return {
    title: t('title'),
    description: t('description')
  };
}

export default function ChatPage() {
  return (
        <ChatWidget />
    
  );
}
