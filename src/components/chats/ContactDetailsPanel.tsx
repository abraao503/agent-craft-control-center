import React from "react";
import {
  User,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Conversation } from "@/types/conversation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ContactDetailsPanelProps = {
  conversation: Conversation;
};

export const ContactDetailsPanel: React.FC<ContactDetailsPanelProps> = ({
  conversation,
}) => {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
                {/* Phone */}
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="text-sm font-medium">
                      {conversation.customer.phone}
                    </p>
                  </div>
                </div>

                {/* Name/Identifier */}
                {conversation.customer.identifier && (
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Nome</p>
                      <p className="text-sm font-medium">
                        {conversation.customer.identifier}
                      </p>
                    </div>
                  </div>
                )}

                {/* Last Interaction */}
                {conversation.lastInteraction && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        Última Interação
                      </p>
                      <p className="text-sm font-medium">
                        {format(
                          new Date(conversation.lastInteraction),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Total Messages */}
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      Total de Mensagens
                    </p>
                    <p className="text-sm font-medium">
                      {conversation.totalMessages}
                    </p>
                  </div>
                </div>
      </div>
    </ScrollArea>
  );
};
