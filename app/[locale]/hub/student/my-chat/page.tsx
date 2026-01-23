import ChatWidget from '@/components/chat/ChatWidget';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat | FluencyLab School',
  description: 'Chat with your students',
};

export default function ChatPage() {
  return (
        <ChatWidget />
    
  );
}
