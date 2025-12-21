'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { ChannelSort, ChannelOptions } from 'stream-chat';
import { 
  Chat, 
  ChannelList, 
  Channel as ChannelComponent, 
  Window, 
  MessageList, 
  MessageInput, 
  Thread, 
  LoadingIndicator,
  useChatContext,
  ChannelHeader
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import './chat.css'; 

import { useChatContacts, ChatContact } from '@/hooks/useChatContacts';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatClient } from '@/context/ChatClientContext';

interface ChatUser {
  id: string;
  name: string;
  image?: string;
}

const ChatLayout = () => {
  const { channel, setActiveChannel, client } = useChatContext();
  const isMobile = useIsMobile();
  
  // Visibility logic
  const showList = !isMobile || !channel;
  const showChannel = !isMobile || !!channel;

  const filters = useMemo(() => ({ 
    type: 'messaging', 
    members: { $in: [client.userID!] } 
  }), [client.userID]);

  const sort: ChannelSort = useMemo(() => ({ last_message_at: -1 }), []);
  const options: ChannelOptions = useMemo(() => ({ limit: 10 }), []);
  
  return (
    <div className={cn(
      "flex w-full h-full overflow-hidden bg-background", 
      // The CSS file handles the dark mode specific overrides
    )}>
      {/* Sidebar / Channel List */}
      <div className={cn(
        "flex flex-col bg-sidebar border-r border-border",
        isMobile ? "w-full" : "w-1/3 min-w-[250px]",
        !showList && "hidden"
      )}>
        <ChannelList 
          filters={filters} 
          sort={sort} 
          options={options} 
          showChannelSearch
        />
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex flex-col bg-background", 
        isMobile ? "w-full" : "w-2/3",
        !showChannel && "hidden"
      )}>
        <ChannelComponent>
          <Window>
            {isMobile && (
              <div className="flex items-center p-2 border-b border-border bg-muted/30">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="mr-2"
                  onClick={() => setActiveChannel(undefined)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <span className="font-medium text-sm">Voltar</span>
              </div>
            )}
            <ChannelHeader />
            <div className="flex-1 overflow-hidden relative">
              <MessageList />
            </div>
            <MessageInput />
          </Window>
          <Thread />
        </ChannelComponent>
      </div>
    </div>
  );
};

const ChatInterface = ({ user, contacts }: { user: ChatUser; contacts: ChatContact[] }) => {
  const [channelsCreated, setChannelsCreated] = useState(false);
  const { resolvedTheme } = useTheme();
  const { client } = useChatClient();

  // Logic to ensure channels exist between user and contacts
  useEffect(() => {
    if (!client || contacts.length === 0 || channelsCreated) return;

    const createChannels = async () => {
      try {
        const filter = { type: 'messaging', members: { $in: [user.id] } };
        const existingChannels = await client.queryChannels(filter, {}, { limit: 30 });
        const existingMemberIds = new Set<string>();
        
        existingChannels.forEach(channel => {
          const members = Object.values(channel.state.members);
          members.forEach(member => {
            if (member.user_id !== user.id && member.user_id) {
              existingMemberIds.add(member.user_id);
            }
          });
        });

        const contactsNeedingChannel = contacts.filter(
          contact => !existingMemberIds.has(contact.id)
        );

        if (contactsNeedingChannel.length === 0) {
          setChannelsCreated(true);
          return;
        }

        const chunkSize = 1; 
        for (let i = 0; i < contactsNeedingChannel.length; i += chunkSize) {
          const chunk = contactsNeedingChannel.slice(i, i + chunkSize);
          
          await Promise.all(chunk.map(async (contact) => {
            try {
              const channel = client.channel('messaging', {
                members: [user.id, contact.id],
              });

              // Optional: Sync user data if your backend requires it
              await fetch('/api/chat/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  users: [
                    { id: user.id, name: user.name, image: user.image },
                    { id: contact.id, name: contact.name, image: contact.image }
                  ]
                })
              });

              await channel.watch(); 
            } catch (err) {
              console.error(`Failed to create channel for ${contact.id}:`, err);
            }
          }));
          
          if (i + chunkSize < contactsNeedingChannel.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        setChannelsCreated(true);
      } catch (error) {
        console.error('Error creating channels:', error);
        setChannelsCreated(true);
      }
    };

    createChannels();
  }, [client, contacts, user.id, user.name, user.image, channelsCreated]);

  if (!client) {
    return (
      <div className="flex justify-center items-center h-full w-full bg-background rounded-lg border border-border">
        <LoadingIndicator />
      </div>
    );
  }

  const streamTheme = resolvedTheme === 'dark' ? 'messaging dark' : 'messaging light';

  return (
    <div className="flex h-full w-full border border-border rounded-lg overflow-hidden bg-background shadow-sm">
      <Chat client={client} theme={streamTheme}>
        <ChatLayout />
      </Chat>
    </div>
  );
};

export default function ChatWidget() {
  const { data: session, status } = useSession();
  const { contacts, loading: contactsLoading, error: contactsError } = useChatContacts();

  const user = useMemo(() => {
    if (!session?.user?.id) return null;
    
    return {
      id: session.user.id,
      name: session.user.name || session.user.email || 'User',
      image: session.user.image || undefined,
    } as ChatUser;
  }, [session?.user?.id, session?.user?.name, session?.user?.email, session?.user?.image]);
  
  if (status === 'loading' || contactsLoading) {
    return (
      <div className="flex justify-center items-center h-full w-full bg-background rounded-lg border border-border">
        <LoadingIndicator />
      </div>
    );
  }

  if (contactsError) {
    return (
      <div className="flex justify-center items-center h-full w-full bg-background rounded-lg border border-destructive/50 text-destructive">
        Erro ao carregar contatos: {contactsError}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <ChatInterface user={user} contacts={contacts} />;
}