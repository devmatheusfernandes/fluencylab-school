import ChatWidget from '@/components/chat/ChatWidget';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat | FluencyLab School',
  description: 'Chat with your students',
};

export default function ChatPage() {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 min-h-0">
        <ChatWidget />
      </div>
    </div>
  );
}
