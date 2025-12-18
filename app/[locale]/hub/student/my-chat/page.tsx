import ChatWidget from '@/components/chat/ChatWidget';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat | FluencyLab School',
  description: 'Chat with your students',
};

export default function ChatPage() {
  return (
    <div className="h-full w-full p-4 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Mensagens
        </h1>
      </div>
      
      <div className="flex-1 min-h-0">
        <ChatWidget />
      </div>
    </div>
  );
}
