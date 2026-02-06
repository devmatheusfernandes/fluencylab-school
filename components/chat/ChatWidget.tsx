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
import {
  Menu,
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  X,
  PanelRight,
} from "lucide-react";
import "./chat.css";

import { useChatContacts } from "@/hooks/communication/useChatContacts";
import { useIsMobile } from "@/hooks/ui/useMobile";
import { useChatClient } from "@/context/ChatClientContext";
import { cn } from "@/lib/utils";
import { UserAvatar } from "../ui/user-avatar";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { useUserProfile } from "@/hooks/user/useUserProfile";
import { useSession } from "next-auth/react";
import { UserAvatarBubble } from "../ui/user-avatar-bubble";
import { useTranslations } from "next-intl";
import { CustomAttachment } from "./ModernAudioPlayer";
import { PillMessageInput } from "./PillMessageInput";
import { ThemeSwitcher } from "../ThemeSwitcher";

// --- COMPONENTE: Preview do Canal (Item da Lista) ---
const CustomChannelPreview = (props: ChannelPreviewUIComponentProps) => {
  const t = useTranslations("ChatWidget");
  const { channel, setActiveChannel, active } = props;
  const { client } = useChatContext();

  const members = Object.values(channel.state.members).filter(
    (m) => m.user_id !== client.userID,
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
          : "hover:bg-primary/15 hover:border-r hover:border-primary/25 transition-all duration-200 ease-in-out cursor-pointer",
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
            {otherMember?.name || t("defaultUser")}
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
              : "text-[#a1a1aa]",
          )}
        >
          {lastMessage?.text || t("noMessages")}
        </p>
      </div>
    </button>
  );
};

// --- COMPONENTE: Painel de Galeria de Mídia ---
const MediaGalleryPanel = () => {
  const t = useTranslations("ChatWidget");
  const { channel } = useChatContext();
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"images" | "files">("images");

  useEffect(() => {
    if (!channel) return;

    const loadMedia = async () => {
      const messages = await channel.query({
        messages: { limit: 100 },
      });

      const items = messages.messages
        .flatMap((msg) => msg.attachments || [])
        .filter((att) => {
          if (activeTab === "images") {
            return att.type === "image";
          }
          return att.type === "file";
        });

      setMediaItems(items);
    };

    loadMedia();
  }, [channel, activeTab]);

  if (!channel) return null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header com Tabs */}
      <div className="p-4 border-b border-primary/20">
        <h2 className="font-bold text-lg mb-3">{t("sharedMedia")}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("images")}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg transition-colors",
              activeTab === "images"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/20 hover:bg-secondary/30",
            )}
          >
            <ImageIcon size={18} className="inline mr-2" />
            {t("images")}
          </button>
          <button
            onClick={() => setActiveTab("files")}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg transition-colors",
              activeTab === "files"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/20 hover:bg-secondary/30",
            )}
          >
            <FileText size={18} className="inline mr-2" />
            {t("files")}
          </button>
        </div>
      </div>

      {/* Grid de Mídia */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "images" ? (
          <div className="grid grid-cols-3 gap-2">
            {mediaItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedMedia(item)}
                className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
              >
                <img
                  src={item.image_url || item.thumb_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {mediaItems.map((item, idx) => (
              <a
                key={idx}
                href={item.asset_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/20 transition-colors"
              >
                <FileText size={24} className="text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {(item.file_size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}

        {mediaItems.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            {activeTab === "images" ? (
              <ImageIcon size={48} />
            ) : (
              <FileText size={48} />
            )}
            <p className="mt-2">{t("noMedia")}</p>
          </div>
        )}
      </div>

      {/* Modal de Preview */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedMedia(null)}
          >
            <X size={32} />
          </button>
          <img
            src={selectedMedia.image_url}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE: Header Personalizado ---
const CustomChannelHeader = ({
  onToggleGallery,
  showGallery,
}: {
  onToggleGallery?: () => void;
  showGallery?: boolean;
}) => {
  const t = useTranslations("ChatWidget");
  const { channel, client } = useChatContext();
  const { setActiveChannel } = useChatContext();
  const { typing } = useTypingContext();
  const isMobile = useIsMobile();
  const { user } = useCurrentUser();

  const members = Object.values(channel?.state.members || {}).filter(
    (m) => m.user_id !== client.userID,
  );
  const otherMember = members[0]?.user;

  // Filtra quem está digitando (excluindo o próprio usuário)
  const typingUsers = Object.values(typing || {}).filter(
    (user) => user.user?.id !== client.userID,
  );
  const isTyping = typingUsers.length > 0;

  return (
    <div className="custom-channel-header justify-between">
      <div className="flex items-center gap-3">
        {/* Botão Voltar (Apenas Mobile) */}
        {isMobile && (
          <button
            onClick={() => setActiveChannel?.(undefined)}
            className="p-2 -ml-2 rounded-full hover:bg-foreground/20 text-foreground"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <UserAvatar size="sm" src={user?.avatarUrl} name={user?.name} />
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-foreground leading-tight capitalize">
            {otherMember?.name || t("defaultChatName")}
          </span>
          <span className="text-xs text-[#a1a1aa] flex items-center gap-1">
            {isTyping ? (
              <span className="animate-pulse text-primary font-medium">
                {t("typing")}
              </span>
            ) : otherMember?.online ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{" "}
                {t("online")}
              </>
            ) : (
              t("offline")
            )}
          </span>
        </div>
      </div>{" "}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleGallery}
          className={cn(
            "p-2 rounded-full transition-colors",
            showGallery
              ? "bg-primary/20 text-primary"
              : "hover:bg-secondary/20 text-foreground",
          )}
          title={t("mediaGallery")}
        >
          <PanelRight size={20} />
        </button>
        <ThemeSwitcher />
      </div>
    </div>
  );
};

// --- LAYOUT PRINCIPAL ---
const ChatLayout = () => {
  const { channel, client } = useChatContext();
  const isMobile = useIsMobile();
  const t = useTranslations("ChatWidget");
  const [showGallery, setShowGallery] = useState(false);

  const showList = !isMobile || !channel;
  const showChat = !isMobile || !!channel;

  const filters = useMemo(
    () => ({
      type: "messaging",
      members: { $in: [client.userID as string] },
    }),
    [client.userID],
  );

  const sort = useMemo(() => ({ last_message_at: -1 as const }), []);
  const options = useMemo(
    () => ({ limit: 20, watch: true, presence: true }),
    [],
  );

  return (
    <div className="flex w-full h-full bg-background rounded-md overflow-hidden">
      {/* --- COLUNA ESQUERDA: LISTA --- */}
      <div
        className={cn(
          "flex-col  h-full",
          isMobile ? "w-full" : "w-[340px] shrink-0",
          showList ? "flex" : "hidden",
        )}
      >
        <div className="p-4 border-b border-primary/20 h-[60px] flex items-center justify-center shrink-0">
          <h1 className="font-bold text-lg">{t("messagesTitle")}</h1>
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
          "flex-col flex-1 h-full bg-background w-full min-w-0",
          showChat ? "flex" : "hidden",
        )}
      >
        {channel ? (
          <Channel
            TypingIndicator={() => null}
            Avatar={UserAvatarBubble}
            Attachment={CustomAttachment}
          >
            <Window>
              <div className="flex flex-col h-full w-full overflow-hidden">
                <div className="sticky top-0 flex-none z-10 sm:border-none border-t border-primary/20">
                  <CustomChannelHeader
                    onToggleGallery={() => setShowGallery(!showGallery)}
                    showGallery={showGallery}
                  />
                </div>

                <div className="flex-1 min-h-0 w-full relative">
                  <MessageList disableDateSeparator={false} />
                </div>
                <MessageInput
                  focus
                  audioRecordingEnabled={true}
                  Input={PillMessageInput}
                />
              </div>
            </Window>
            <Thread />
          </Channel>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#52525b]">
            <div className="w-16 h-16 bg-[#18181b] rounded-full flex items-center justify-center mb-4">
              <Menu size={32} />
            </div>
            <p>{t("selectChatPrompt")}</p>
          </div>
        )}
      </div>

      {/* --- COLUNA DA GALERIA --- */}
      {showGallery && channel && (
        <div
          className={cn(
            "border-l border-primary/20 bg-background h-full transition-all duration-300 ease-in-out",
            isMobile ? "fixed inset-0 z-50 w-full" : "w-[320px] shrink-0",
          )}
        >
          {isMobile && (
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => setShowGallery(false)}
                className="p-2 bg-background/80 rounded-full shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
          )}
          <MediaGalleryPanel />
        </div>
      )}
    </div>
  );
};

// --- WIDGET EXPORTADO ---
export default function ChatWidget() {
  const { data: session } = useSession();
  const { client } = useChatClient();
  const { contacts } = useChatContacts();
  const [channelsCreated, setChannelsCreated] = useState(false);

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
          { limit: 30 },
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
          (contact) => !existingMemberIds.has(contact.id),
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
          }),
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
