'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ChannelFilters, ChannelSort, ChannelOptions } from 'stream-chat';
import { 
  Chat, 
  ChannelList, 
  Channel as ChannelComponent, 
  Window, 
  MessageList, 
  MessageInput, 
  Thread, 
  useCreateChatClient,
  LoadingIndicator
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import { useChatContacts, ChatContact } from '@/hooks/useChatContacts';

interface ChatUser {
    id: string;
    name: string;
    image?: string;
}

const ChatInterface = ({ user, contacts }: { user: ChatUser; contacts: ChatContact[] }) => {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
    const [channelsCreated, setChannelsCreated] = useState(false);

    const tokenOrProvider = useCallback(async () => {
        const response = await fetch('/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
        });
        const data = await response.json();
        return data.token;
    }, [user.id]);

    const client = useCreateChatClient({
        apiKey,
        userData: user,
        tokenOrProvider,
    });

    // Effect to ensure channels exist between user and contacts
    useEffect(() => {
        if (!client || contacts.length === 0 || channelsCreated) return;

        const createChannels = async () => {
            try {
                // Check if we have existing channels first to avoid unnecessary creation
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

                // Filter contacts that don't have a channel yet
                const contactsNeedingChannel = contacts.filter(
                    contact => !existingMemberIds.has(contact.id)
                );

                if (contactsNeedingChannel.length === 0) {
                    setChannelsCreated(true);
                    return;
                }

                // Process contacts in chunks to avoid rate limiting (429)
                const chunkSize = 1; // Process 1 at a time to be extra safe
                for (let i = 0; i < contactsNeedingChannel.length; i += chunkSize) {
                    const chunk = contactsNeedingChannel.slice(i, i + chunkSize);
                    
                    await Promise.all(chunk.map(async (contact) => {
                        try {
                            const channel = client.channel('messaging', {
                                members: [user.id, contact.id],
                            });

                            // Sync users via server-side API before creating channel
                            // This avoids "User not allowed to perform action UpdateUser" error
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

                            // create() is lighter than watch() if we just want to ensure existence
                            // But the UI might try to use this channel instance immediately, so we must watch it
                            await channel.watch(); 
                        } catch (err) {
                            console.error(`Failed to create channel for ${contact.id}:`, err);
                        }
                    }));
                    
                    // Delay between chunks if there are more chunks
                    if (i + chunkSize < contactsNeedingChannel.length) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }

                setChannelsCreated(true);
            } catch (error) {
                console.error('Error creating channels:', error);
                // Even if error, we set created to true to stop loop, user can refresh if needed
                setChannelsCreated(true);
            }
        };

        createChannels();
    }, [client, contacts, user.id, channelsCreated]);

    if (!client) {
        return (
            <div className="flex justify-center items-center h-[500px] w-full bg-white rounded-lg border">
                <LoadingIndicator />
            </div>
        );
    }

    const filters: ChannelFilters = { 
        type: 'messaging', 
        members: { $in: [user.id] } 
    };
    const sort: ChannelSort = { last_message_at: -1 };
    const options: ChannelOptions = { limit: 10 };

    return (
        <div className="flex h-[80vh] w-full border rounded-lg overflow-hidden bg-white shadow-sm">
            <Chat client={client} theme="messaging light">
                <div className="flex w-full h-full">
                    <div className="w-1/3 border-r min-w-[250px] flex flex-col bg-gray-50">
                        <ChannelList 
                            filters={filters} 
                            sort={sort} 
                            options={options} 
                            showChannelSearch
                        />
                    </div>
                    <div className="w-2/3 flex flex-col bg-white">
                        <ChannelComponent>
                            <Window>
                                <div className="flex-1 overflow-hidden relative">
                                    <MessageList />
                                </div>
                                <MessageInput />
                            </Window>
                            <Thread />
                        </ChannelComponent>
                    </div>
                </div>
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
          <div className="flex justify-center items-center h-[500px] w-full bg-white rounded-lg border">
              <LoadingIndicator />
          </div>
      );
  }

  if (contactsError) {
      return (
          <div className="flex justify-center items-center h-[500px] w-full bg-white rounded-lg border text-red-500">
              Erro ao carregar contatos: {contactsError}
          </div>
      );
  }

  if (!user) {
      return null;
  }

  return <ChatInterface user={user} contacts={contacts} />;
}
