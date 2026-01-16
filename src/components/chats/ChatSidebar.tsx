import React, { useState } from "react";
import {
  User,
  Calendar,
  Tag as TagIcon,
  List,
  ChevronLeft,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Conversation } from "@/types/conversation";
import { ContactDetailsPanel } from "./ContactDetailsPanel";
import { DealsPanel } from "./DealsPanel";
import { ChatTagManager } from "@/components/tags/ChatTagManager";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ChatSidebarProps = {
  conversation: Conversation;
  onUpdateConversation: (conversation: Conversation) => void;
};

type SidebarView = "contact" | "deals" | "tags" | "tasks" | null;

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversation,
  onUpdateConversation,
}) => {
  const [activeView, setActiveView] = useState<SidebarView>(null);

  const handleViewToggle = (view: SidebarView) => {
    setActiveView(activeView === view ? null : view);
  };

  return (
    <div className="flex h-full relative">
      {/* Icon Bar */}
      <div className="w-14 bg-background border-l flex flex-col items-center py-4 gap-2 z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeView === "contact" ? "default" : "ghost"}
                size="icon"
                onClick={() => handleViewToggle("contact")}
                className="w-10 h-10"
              >
                <User className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Contato</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeView === "deals" ? "default" : "ghost"}
                size="icon"
                onClick={() => handleViewToggle("deals")}
                className="w-10 h-10"
              >
                <DollarSign className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Negócios</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeView === "tags" ? "default" : "ghost"}
                size="icon"
                onClick={() => handleViewToggle("tags")}
                className="w-10 h-10"
              >
                <TagIcon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Tags</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeView === "tasks" ? "default" : "ghost"}
                size="icon"
                onClick={() => handleViewToggle("tasks")}
                className="w-10 h-10"
              >
                <List className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Tarefas</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Content Panel - Overlay on small screens, inline on large screens */}
      {activeView && (
        <div className="absolute lg:relative right-14 lg:right-0 top-0 h-full w-72 lg:w-64 xl:w-72 2xl:w-80 border-l bg-background flex flex-col shadow-lg lg:shadow-none z-20">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm">
              {activeView === "contact" && "Contato"}
              {activeView === "deals" && "Negócios"}
              {activeView === "tags" && "Tags"}
              {activeView === "tasks" && "Tarefas"}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveView(null)}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeView === "contact" && (
              <ContactDetailsPanel conversation={conversation} />
            )}
            {activeView === "deals" && (
              <DealsPanel conversation={conversation} />
            )}
            {activeView === "tags" && (
              <div className="p-4">
                <ChatTagManager
                  chatId={conversation.id}
                  initialChatTags={conversation.tags || []}
                  onTagsChange={(tags) => {
                    const updatedConversation = {
                      ...conversation,
                      tags,
                    };
                    onUpdateConversation(updatedConversation);
                  }}
                />
              </div>
            )}
            {activeView === "tasks" && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Em desenvolvimento
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
