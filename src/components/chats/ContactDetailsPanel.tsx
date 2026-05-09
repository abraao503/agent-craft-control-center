import React, { useState } from "react";
import {
  User,
  Phone,
  Mail,
  Calendar,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Conversation } from "@/types/conversation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatPhone } from "@/utils/phone";
import { useMutation } from "@tanstack/react-query";
import { updateCustomerEmail, updateCustomerPhone } from "@/services/customer";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { AxiosError } from "axios";

type ContactDetailsPanelProps = {
  conversation: Conversation;
  onUpdateConversation: (conversation: Conversation) => void;
};

type EditableField = "phone" | "email" | null;

export const ContactDetailsPanel: React.FC<ContactDetailsPanelProps> = ({
  conversation,
  onUpdateConversation,
}) => {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspaceContext();
  const [editingField, setEditingField] = useState<EditableField>(null);
  const [phoneValue, setPhoneValue] = useState(conversation.customer.phone);
  const [emailValue, setEmailValue] = useState(
    conversation.customer.email ?? "",
  );

  const updatePhoneMutation = useMutation({
    mutationFn: (phone: string) =>
      updateCustomerPhone({
        customerId: conversation.customer.id,
        phone,
        workspaceId: currentWorkspace!.id,
      }),
    onSuccess: () => {
      onUpdateConversation({
        ...conversation,
        customer: { ...conversation.customer, phone: phoneValue },
      });
      setEditingField(null);
      toast({ title: "Telefone atualizado com sucesso" });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      const message = error.response?.data?.message;
      const description =
        message === "Phone already in use"
          ? "Este telefone já está em uso por outro cliente."
          : message === "Customer not found"
            ? "Cliente não encontrado."
            : "Não foi possível atualizar o telefone. Tente novamente.";

      toast({
        title: "Erro ao atualizar telefone",
        description,
        variant: "destructive",
      });
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: (email: string) =>
      updateCustomerEmail({
        customerId: conversation.customer.id,
        email,
        workspaceId: currentWorkspace!.id,
      }),
    onSuccess: () => {
      onUpdateConversation({
        ...conversation,
        customer: { ...conversation.customer, email: emailValue },
      });
      setEditingField(null);
      toast({ title: "Email atualizado com sucesso" });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      const message = error.response?.data?.message;
      const description =
        message === "Customer not found"
          ? "Cliente não encontrado."
          : "Não foi possível atualizar o email. Tente novamente.";

      toast({
        title: "Erro ao atualizar email",
        description,
        variant: "destructive",
      });
    },
  });

  const handleStartEdit = (field: EditableField) => {
    if (field === "phone") setPhoneValue(conversation.customer.phone);
    if (field === "email") setEmailValue(conversation.customer.email ?? "");
    setEditingField(field);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
  };

  const handleSavePhone = () => {
    if (!phoneValue.trim()) return;
    updatePhoneMutation.mutate(phoneValue.trim());
  };

  const handleSaveEmail = () => {
    updateEmailMutation.mutate(emailValue.trim());
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {/* Phone */}
        <div className="flex items-start gap-3">
          <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Telefone</p>
            {editingField === "phone" ? (
              <div className="flex items-center gap-1 mt-1">
                <Input
                  value={phoneValue}
                  onChange={(e) => setPhoneValue(e.target.value)}
                  className="h-7 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSavePhone();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={handleSavePhone}
                  disabled={updatePhoneMutation.isPending}
                >
                  {updatePhoneMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3 text-green-600" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={handleCancelEdit}
                  disabled={updatePhoneMutation.isPending}
                >
                  <X className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate">
                  {formatPhone(conversation.customer.phone)}
                </p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
                  onClick={() => handleStartEdit("phone")}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start gap-3">
          <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Email</p>
            {editingField === "email" ? (
              <div className="flex items-center gap-1 mt-1">
                <Input
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  className="h-7 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEmail();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={handleSaveEmail}
                  disabled={updateEmailMutation.isPending}
                >
                  {updateEmailMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3 text-green-600" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={handleCancelEdit}
                  disabled={updateEmailMutation.isPending}
                >
                  <X className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate">
                  {conversation.customer.email || (
                    <span className="text-muted-foreground italic">
                      Não informado
                    </span>
                  )}
                </p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
                  onClick={() => handleStartEdit("email")}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
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
              <p className="text-xs text-muted-foreground">Última Interação</p>
              <p className="text-sm font-medium">
                {format(
                  new Date(conversation.lastInteraction),
                  "dd/MM/yyyy 'às' HH:mm",
                  { locale: ptBR },
                )}
              </p>
            </div>
          </div>
        )}

        {/* Total Messages */}
        <div className="flex items-start gap-3">
          <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Total de Mensagens</p>
            <p className="text-sm font-medium">{conversation.totalMessages}</p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};
