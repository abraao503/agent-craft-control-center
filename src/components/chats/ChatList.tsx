import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Conversation } from "@/types/conversation";
import { isColorDark } from "@/lib/utils";

type ChatListProps = {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isLoading?: boolean;
};

export const ChatList: React.FC<ChatListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  searchValue,
  onSearchChange,
  isLoading,
}) => {
  const formatLastInteraction = (date: Date | null) => {
    if (!date) return "";

    const now = new Date();
    const messageDate = new Date(date);
    const diffInDays = Math.floor(
      (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      return format(messageDate, "HH:mm");
    } else if (diffInDays === 1) {
      return "Ontem";
    } else if (diffInDays < 7) {
      return format(messageDate, "EEEE", { locale: ptBR });
    } else {
      return format(messageDate, "dd/MM/yyyy");
    }
  };

  const getInitials = (name?: string, phone?: string) => {
    if (name) {
      const parts = name.split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (phone) {
      return phone.substring(0, 2);
    }
    return "??";
  };

  return (
    <div className="flex flex-col h-full border-r bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold mb-3">Chats</h2>
        <div className="relative">
          {isLoading ? (
            <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
          <Input
            type="search"
            placeholder="Buscar ou começar uma nova conversa"
            className="pl-10"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {isLoading ? "Buscando..." : "Nenhuma conversa encontrada"}
          </div>
        ) : (
          <div className="divide-y" style={{ opacity: isLoading ? 0.5 : 1 }}>
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedConversationId === conversation.id ? "bg-muted" : ""
                }`}
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(
                        conversation.customer.identifier,
                        conversation.customer.phone
                      )}
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold truncate">
                        {conversation.customer.identifier ||
                          conversation.customer.phone}
                      </h3>
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {formatLastInteraction(conversation.lastInteraction)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          conversation.handledBy === "ai"
                            ? "default"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {conversation.handledBy === "ai" ? "IA" : "Humano"}
                      </Badge>
                      {conversation.agent && (
                        <span className="text-xs text-muted-foreground truncate">
                          {conversation.agent.name}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {conversation.tags && conversation.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {conversation.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag.id}
                            style={{
                              backgroundColor: tag.color,
                              color: isColorDark(tag.color) ? "white" : "black",
                            }}
                            className="text-xs"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                        {conversation.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{conversation.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
