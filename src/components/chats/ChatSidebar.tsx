import React, { useCallback, useState } from "react";
import {
  PanelRight,
  PanelRightClose,
  Tags,
  UserRound,
} from "lucide-react";
import { Conversation } from "@/types/conversation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ContactDetailsPanel } from "./ContactDetailsPanel";
import { DealsPanel } from "./DealsPanel";
import { ChatTagManager } from "@/components/tags/ChatTagManager";

type ChatSidebarProps = {
  conversation: Conversation;
  onUpdateConversation: (conversation: Conversation) => void;
};

type ContextPanelProps = {
  conversation: Conversation;
  onUpdateConversation: (conversation: Conversation) => void;
  mobile?: boolean;
  onCollapse?: () => void;
};

const ContextPanel: React.FC<ContextPanelProps> = ({
  conversation,
  onUpdateConversation,
  mobile = false,
  onCollapse,
}) => {
  const handleTagsChange = useCallback(
    (tags: Conversation["tags"]) => {
      onUpdateConversation({ ...conversation, tags });
    },
    [conversation, onUpdateConversation],
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background">
      <div
        className={`flex shrink-0 items-center justify-between border-b px-4 py-3 ${mobile ? "pr-12" : ""}`}
      >
        <div>
          <p className="text-sm font-semibold">Contexto da conversa</p>
          <p className="text-xs text-muted-foreground">
            Negócio, classificação e contato
          </p>
        </div>
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onCollapse}
            aria-label="Recolher contexto da conversa"
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4">
          <DealsPanel conversation={conversation} embedded />

          <section className="rounded-xl border bg-card p-3 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Tags className="h-4 w-4 text-muted-foreground" />
              <div>
                <h2 className="text-sm font-semibold">Tags</h2>
                <p className="text-xs text-muted-foreground">
                  Classifique esta conversa
                </p>
              </div>
            </div>
            <ChatTagManager
              chatId={conversation.id}
              initialChatTags={conversation.tags || []}
              onTagsChange={handleTagsChange}
              showLabel={false}
            />
          </section>

          <Accordion
            type="multiple"
            defaultValue={["contact"]}
            className="rounded-xl border bg-card px-3 shadow-sm"
          >
            <AccordionItem value="contact" className="border-0">
              <AccordionTrigger className="py-3 text-sm hover:no-underline">
                <span className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  Dados do contato
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <ContactDetailsPanel conversation={conversation} onUpdateConversation={onUpdateConversation} embedded />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
};

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversation,
  onUpdateConversation,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <aside
        className={
          isCollapsed
            ? "hidden h-full w-11 shrink-0 border-l bg-background lg:flex lg:flex-col lg:items-center lg:pt-3"
            : "hidden h-full w-[336px] shrink-0 border-l lg:flex"
        }
        aria-label="Contexto da conversa"
      >
        {isCollapsed ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsCollapsed(false)}
            aria-label="Expandir contexto da conversa"
          >
            <PanelRight className="h-4 w-4" />
          </Button>
        ) : (
          <ContextPanel
            conversation={conversation}
            onUpdateConversation={onUpdateConversation}
            onCollapse={() => setIsCollapsed(true)}
          />
        )}
      </aside>

      <div className="flex h-full shrink-0 items-start border-l px-1 pt-2 lg:hidden">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              aria-label="Abrir contexto da conversa"
            >
              <PanelRight className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(92vw,380px)] p-0 sm:max-w-[380px]">
            <SheetHeader className="sr-only">
              <SheetTitle>Contexto da conversa</SheetTitle>
              <SheetDescription>
                Informações do negócio, tags e dados do contato.
              </SheetDescription>
            </SheetHeader>
            <ContextPanel
              conversation={conversation}
              onUpdateConversation={onUpdateConversation}
              mobile
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
