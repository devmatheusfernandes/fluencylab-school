'use client';

import React, { createContext, useContext } from 'react';
import { StreamChat } from 'stream-chat';

type ChatClientContextType = {
  client: StreamChat | null;
};

const ChatClientContext = createContext<ChatClientContextType>({ client: null });

export const useChatClient = () => useContext(ChatClientContext);

export const ChatClientProvider = ({ 
  children, 
  client 
}: { 
  children: React.ReactNode; 
  client: StreamChat | null; 
}) => {
  return (
    <ChatClientContext.Provider value={{ client }}>
      {children}
    </ChatClientContext.Provider>
  );
};
