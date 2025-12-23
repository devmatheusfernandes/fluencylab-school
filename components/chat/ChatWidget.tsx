"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Chat,
  ChannelList,
  Channel,
  Window,
  MessageList,
  MessageInput,
  Thread,
  LoadingIndicator,
  useChatContext,
  ChannelPreviewUIComponentProps,
  useTypingContext,
} from "stream-chat-react";
import { Menu, ArrowLeft } from "lucide-react";
import "./chat.css";

import { useChatContacts } from "@/hooks/useChatContacts";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChatClient } from "@/context/ChatClientContext";
import { cn } from "@/lib/utils";
import { UserAvatar } from "../ui/user-avatar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSession } from "next-auth/react";
import { UserAvatarBubble } from "../ui/user-avatar-bubble";

// --- COMPONENTE: Preview do Canal (Item da Lista) ---
const CustomChannelPreview = (props: ChannelPreviewUIComponentProps) => {
  const { channel, setActiveChannel, active } = props;
  const { client } = useChatContext();

  const members = Object.values(channel.state.members).filter(
    (m) => m.user_id !== client.userID
  );
  const otherMember = members[0]?.user;
  const { userProfile } = useUserProfile(otherMember?.id);
  
  const lastMessage = channel.state.messages[channel.state.messages.length - 1];

  return (
    <button
      onClick={() => setActiveChannel?.(channel)}
      className={cn(
        "flex w-full items-center gap-3 p-4 text-left rounded-lg my-1 transition-all duration-200 ease-in-out cursor-pointer",
        active
          ? "bg-foreground/8 transition-all duration-200 ease-in-out cursor-pointer"
          : "hover:bg-primary/15 hover:border-r hover:border-primary/25 transition-all duration-200 ease-in-out cursor-pointer"
      )}
    >
      <UserAvatar
        size="sm"
        src={userProfile?.avatarUrl}
        name={otherMember?.name}
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <span className="font-semibold text-foreground truncate text-sm capitalize">
            {otherMember?.name || "Usuário"}
          </span>
          {lastMessage?.created_at && (
            <span className="text-[10px] text-[#a1a1aa]">
              {new Date(lastMessage.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <p
          className={cn(
            "text-xs truncate",
            channel.countUnread() > 0
              ? "text-foreground font-bold"
              : "text-[#a1a1aa]"
          )}
        >
          {lastMessage?.text || "Sem mensagens"}
        </p>
      </div>
    </button>
  );
};

// --- COMPONENTE: Header Personalizado ---
const CustomChannelHeader = () => {
  const { channel, client } = useChatContext();
  const { setActiveChannel } = useChatContext();
  const { typing } = useTypingContext();
  const isMobile = useIsMobile();
  const { user } = useCurrentUser();

  const members = Object.values(channel?.state.members || {}).filter(
    (m) => m.user_id !== client.userID
  );
  const otherMember = members[0]?.user;

  // Filtra quem está digitando (excluindo o próprio usuário)
  const typingUsers = Object.values(typing || {}).filter(
    (user) => user.user?.id !== client.userID
  );
  const isTyping = typingUsers.length > 0;

  return (
    <div className="custom-channel-header justify-between">
      <div className="flex items-center gap-3">
        {/* Botão Voltar (Apenas Mobile) */}
        {isMobile && (
          <button
            onClick={() => setActiveChannel?.(undefined)}
            className="p-2 -ml-2 rounded-full hover:bg-[#27272a] text-foreground"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <UserAvatar size="sm" src={user?.avatarUrl} name={user?.name} />

        <div className="flex flex-col">
          <span className="font-semibold text-sm text-foreground leading-tight capitalize">
            {otherMember?.name || "Chat"}
          </span>
          <span className="text-xs text-[#a1a1aa] flex items-center gap-1">
            {isTyping ? (
              <span className="animate-pulse text-primary font-medium">
                Digitando...
              </span>
            ) : otherMember?.online ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{" "}
                Online
              </>
            ) : (
              "Offline"
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

// --- LAYOUT PRINCIPAL ---
const ChatLayout = () => {
  const { channel, client } = useChatContext();
  const isMobile = useIsMobile();

  const showList = !isMobile || !channel;
  const showChat = !isMobile || !!channel;

  const filters = useMemo(
    () => ({
      type: "messaging",
      members: { $in: [client.userID as string] },
    }),
    [client.userID]
  );

  const sort = useMemo(() => ({ last_message_at: -1 as const }), []);
  const options = useMemo(
    () => ({ limit: 20, watch: true, presence: true }),
    []
  );

  return (
    <div className="flex w-full h-full bg-background overflow-hidden">
      {/* --- COLUNA ESQUERDA: LISTA --- */}
      <div
        className={cn(
          "flex-col border-r border-primary h-full",
          isMobile ? "w-full" : "w-[340px] shrink-0",
          showList ? "flex" : "hidden"
        )}
      >
        <div className="p-4 border-b border-primary/40 h-[60px] flex items-center justify-center shrink-0">
          <h1 className="font-bold text-lg">Mensagens</h1>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          <ChannelList
            filters={filters}
            sort={sort}
            options={options}
            Preview={CustomChannelPreview}
            showChannelSearch
          />
        </div>
      </div>

      {/* --- COLUNA DIREITA: CHAT --- */}
      <div
        className={cn(
          "flex-col flex-1 h-full bg-background w-full min-w-0", // min-w-0 evita overflow flex
          showChat ? "flex" : "hidden"
        )}
      >
        {channel ? (
          <Channel TypingIndicator={() => null} Avatar={UserAvatarBubble}>
            {/* ESTRUTURA FLEX CORRIGIDA:
                - h-full: Ocupa toda altura disponível
                - flex-col: Empilha Header, Lista, Input
            */}
            <Window>
              <div className="flex flex-col h-full w-full overflow-hidden">
                {/* 1. Header (Fixo no topo) */}
                <div className="flex-none z-10">
                  <CustomChannelHeader />
                </div>

                {/* 2. Lista de Mensagens (Ocupa o meio)
                    - flex-1: Cresce para ocupar espaço
                    - min-h-0: CRUCIAL para o scroll funcionar dentro do flexbox
                    - relative: Para posicionamento interno
                */}
                <div className="flex-1 min-h-0 w-full relative">
                  <MessageList disableDateSeparator={false} />
                </div>

                {/* 3. Input (Fixo no fundo) */}
                <div className="flex-none z-10 bg-[#09090b]">
                  <MessageInput focus maxRows={5} audioRecordingEnabled />
                </div>
              </div>
            </Window>
            <Thread />
          </Channel>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#52525b]">
            <div className="w-16 h-16 bg-[#18181b] rounded-full flex items-center justify-center mb-4">
              <Menu size={32} />
            </div>
            <p>Selecione uma conversa para começar</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- WIDGET EXPORTADO ---
export default function ChatWidget() {
  const { data: session } = useSession();
  const { client } = useChatClient();
  const { contacts } = useChatContacts();
  const [channelsCreated, setChannelsCreated] = useState(false);

  // CORREÇÃO 2: Trazendo de volta a lógica que cria os canais com seus contatos
  useEffect(() => {
    if (
      !client ||
      !session?.user?.id ||
      contacts.length === 0 ||
      channelsCreated
    )
      return;

    const createChannels = async () => {
      const currentUserId = session.user.id;

      try {
        // Verifica canais existentes
        const filter = { type: "messaging", members: { $in: [currentUserId] } };
        const existingChannels = await client.queryChannels(
          filter,
          {},
          { limit: 30 }
        );

        const existingMemberIds = new Set<string>();
        existingChannels.forEach((channel) => {
          const members = Object.values(channel.state.members);
          members.forEach((member) => {
            if (member.user_id !== currentUserId && member.user_id) {
              existingMemberIds.add(member.user_id);
            }
          });
        });

        // Filtra contatos que ainda não tem canal
        const contactsNeedingChannel = contacts.filter(
          (contact) => !existingMemberIds.has(contact.id)
        );

        if (contactsNeedingChannel.length === 0) {
          setChannelsCreated(true);
          return;
        }

        // Cria os canais faltantes
        await Promise.all(
          contactsNeedingChannel.map(async (contact) => {
            const channel = client.channel("messaging", {
              members: [currentUserId, contact.id],
            });
            await channel.watch();
          })
        );

        setChannelsCreated(true);
      } catch (error) {
        console.error("Erro ao criar canais:", error);
        setChannelsCreated(true); // Evita loop infinito em caso de erro
      }
    };

    createChannels();
  }, [client, contacts, session, channelsCreated]);

  if (!client || !session?.user)
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <LoadingIndicator />
      </div>
    );

  return (
    <div className="h-full w-full overflow-hidden">
      <Chat client={client} theme="messaging">
        <ChatLayout />
      </Chat>
    </div>
  );
}
