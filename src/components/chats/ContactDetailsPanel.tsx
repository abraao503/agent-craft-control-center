import React, { useEffect, useState } from "react";
import {
  User,
  Phone,
  Mail,
  Calendar,
  Pencil,
  Check,
  X,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Conversation } from "@/types/conversation";
import { updateCustomerName } from "@/services/customer/updateCustomerName";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatPhone, isValidPhone } from "@/utils/phone";
import { useMutation, useQuery } from "@tanstack/react-query";
import { updateCustomerEmail, updateCustomerPhone } from "@/services/customer";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { AxiosError } from "axios";
import { z } from "zod";
import { useAuth } from "@/contexts/auth/hooks";
import {
  getMetaCloudDiagnostic,
  setMetaCloudConsent,
} from "@/services/whatsapp";

const emailSchema = z
  .string()
  .email("Digite um e-mail válido, por exemplo nome@empresa.com.");

const getEmailValidationError = (value: string): string | null => {
  if (!value.trim()) return null;

  const result = emailSchema.safeParse(value.trim());
  return result.success
    ? null
    : (result.error.issues[0]?.message ?? "Digite um e-mail válido.");
};

type ContactDetailsPanelProps = {
  conversation: Conversation;
  onUpdateConversation: (conversation: Conversation) => void;
  embedded?: boolean;
};

type EditableField = "name" | "phone" | "email" | null;

export const ContactDetailsPanel: React.FC<ContactDetailsPanelProps> = ({
  conversation,
  onUpdateConversation,
  embedded = false,
}) => {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const { userProfile } = useAuth();
  const [editingField, setEditingField] = useState<EditableField>(null);
  const [nameValue, setNameValue] = useState(conversation.customer.name ?? "");
  const [phoneValue, setPhoneValue] = useState(
    conversation.customer.phone ? `+${conversation.customer.phone}` : "",
  );
  const [emailValue, setEmailValue] = useState(
    conversation.customer.email ?? "",
  );
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const canEditName = has("view:chat");
  const canManageConsent = has("manage:whatsapp-consent");
  const metaDiagnosticQuery = useQuery({
    queryKey: ["meta-cloud-diagnostic", "consent"],
    queryFn: getMetaCloudDiagnostic,
    enabled: userProfile?.metaCloudWhatsappEnabled === true && canManageConsent,
    retry: false,
  });
  const metaIntegrationId = metaDiagnosticQuery.data?.integrations.find(
    (integration) => integration.pipelineId === conversation.primaryDeal?.pipeline.id,
  )?.id;
  const consentMutation = useMutation({
    mutationFn: (state: "GRANTED" | "REVOKED") =>
      setMetaCloudConsent({
        customerId: conversation.customer.id,
        integrationId: metaIntegrationId!,
        state,
        source: "manual",
      }),
    onSuccess: (_, state) => {
      toast({
        title: state === "GRANTED" ? "Opt-in concedido" : "Opt-in revogado",
      });
    },
    onError: () => {
      toast({
        title: "Não foi possível atualizar o consentimento",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    setNameValue(conversation.customer.name ?? "");
    setPhoneValue(
      conversation.customer.phone ? `+${conversation.customer.phone}` : "",
    );
    setEmailValue(conversation.customer.email ?? "");
    setEditingField(null);
    setPhoneError(null);
    setEmailError(null);
    setNameError(null);
  }, [
    conversation.customer.id,
    conversation.customer.name,
    conversation.customer.phone,
    conversation.customer.email,
  ]);

  const updatePhoneMutation = useMutation({
    mutationFn: (phone: string) =>
      updateCustomerPhone({
        customerId: conversation.customer.id,
        phone,
        workspaceId: currentWorkspace!.id,
      }),
    onSuccess: (_, updatedPhone) => {
      const storedPhone = updatedPhone.replace(/^\+/, "");

      onUpdateConversation({
        ...conversation,
        customer: { ...conversation.customer, phone: storedPhone },
      });
      setPhoneValue(`+${storedPhone}`);
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
      setPhoneValue(
        conversation.customer.phone ? `+${conversation.customer.phone}` : "",
      );
    },
  });

  const updateNameMutation = useMutation({
    mutationFn: async (name: string) => {
      await updateCustomerName({
        customerId: conversation.customer.id,
        name,
      });
    },
    onSuccess: (_, updatedName) => {
      onUpdateConversation({
        ...conversation,
        customer: { ...conversation.customer, name: updatedName },
      });
      setNameValue(updatedName);
      setEditingField(null);
      toast({ title: "Nome atualizado com sucesso" });
    },
    onError: () => {
      setNameValue(conversation.customer.name ?? "");
      toast({
        title: "Erro ao atualizar nome",
        description: "Não foi possível atualizar o nome. Tente novamente.",
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
    onSuccess: (_, updatedEmail) => {
      onUpdateConversation({
        ...conversation,
        customer: { ...conversation.customer, email: updatedEmail },
      });
      setEmailValue(updatedEmail);
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
      setEmailValue(conversation.customer.email ?? "");
    },
  });

  const handleStartEdit = (field: EditableField) => {
    if (field === "name") {
      setNameValue(conversation.customer.name ?? "");
      setNameError(null);
    }
    if (field === "phone") {
      setPhoneValue(
        conversation.customer.phone ? `+${conversation.customer.phone}` : "",
      );
      setPhoneError(null);
    }
    if (field === "email") setEmailValue(conversation.customer.email ?? "");
    if (field === "email") setEmailError(null);
    setEditingField(field);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setPhoneError(null);
    setEmailError(null);
    setNameError(null);
  };

  const handleSaveName = () => {
    const value = nameValue.trim();

    if (!value) {
      setNameError("Informe o nome do cliente.");
      return;
    }

    setNameError(null);
    updateNameMutation.mutate(value);
  };

  const handleSavePhone = () => {
    const value = phoneValue.trim();

    if (!value) {
      setPhoneError("Informe um número de telefone.");
      return;
    }

    if (!isValidPhone(value)) {
      setPhoneError(
        "Digite um número válido, incluindo DDD e código do país quando necessário.",
      );
      return;
    }

    setPhoneError(null);
    updatePhoneMutation.mutate(value);
  };

  const handleSaveEmail = () => {
    const value = emailValue.trim();

    if (!value) {
      setEmailError(null);
      setEmailValue(conversation.customer.email ?? "");
      setEditingField(null);
      return;
    }

    const validationError = getEmailValidationError(value);

    setEmailError(validationError);
    if (validationError) return;

    updateEmailMutation.mutate(value);
  };

  const content = (
    <div className={embedded ? "space-y-3" : "space-y-3 p-4"}>
        {/* Phone */}
        <div className="flex items-start gap-3">
          <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Telefone</p>
            {editingField === "phone" ? (
              <div className="mt-1 space-y-1">
                <div className="flex items-center gap-1">
                  <PhoneInput
                  defaultCountry="BR"
                  value={phoneValue}
                  onChange={(value) => {
                    setPhoneValue(value || "");
                    setPhoneError(null);
                  }}
                  className="min-w-0 flex-1"
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
                    disabled={updatePhoneMutation.isPending || Boolean(phoneError)}
                    aria-label="Salvar telefone"
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
                    aria-label="Cancelar edição do telefone"
                  >
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
                {phoneError && (
                  <p className="text-xs text-destructive" role="alert">
                    {phoneError}
                  </p>
                )}
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
                  aria-label="Editar telefone"
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
              <div className="mt-1 space-y-1">
                <div className="flex items-center gap-1">
                  <Input
                    type="email"
                    value={emailValue}
                    onChange={(event) => {
                      setEmailValue(event.target.value);
                      setEmailError(null);
                    }}
                    onBlur={() => setEmailError(getEmailValidationError(emailValue))}
                    className="h-7 min-w-0 flex-1 text-sm"
                    autoFocus
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? "contact-email-error" : undefined}
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
                    disabled={updateEmailMutation.isPending || Boolean(emailError)}
                    aria-label="Salvar e-mail"
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
                    aria-label="Cancelar edição do e-mail"
                  >
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
                {emailError && (
                  <p
                    id="contact-email-error"
                    className="text-xs text-destructive"
                    role="alert"
                  >
                    {emailError}
                  </p>
                )}
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
                  aria-label="Editar e-mail"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="flex items-start gap-3">
          <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Nome</p>
            {editingField === "name" ? (
              <div className="mt-1 space-y-1">
                <div className="flex items-center gap-1">
                  <Input
                    value={nameValue}
                    onChange={(event) => {
                      setNameValue(event.target.value);
                      setNameError(null);
                    }}
                    className="h-7 min-w-0 flex-1 text-sm"
                    autoFocus
                    aria-invalid={Boolean(nameError)}
                    aria-describedby={nameError ? "contact-name-error" : undefined}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleSaveName();
                      if (event.key === "Escape") handleCancelEdit();
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={handleSaveName}
                    disabled={updateNameMutation.isPending || Boolean(nameError)}
                    aria-label="Salvar nome"
                  >
                    {updateNameMutation.isPending ? (
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
                    disabled={updateNameMutation.isPending}
                    aria-label="Cancelar edição do nome"
                  >
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
                {nameError && (
                  <p
                    id="contact-name-error"
                    className="text-xs text-destructive"
                    role="alert"
                  >
                    {nameError}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">
                  {conversation.customer.name ||
                    conversation.customer.identifier || (
                      <span className="text-muted-foreground italic">
                        Não informado
                      </span>
                    )}
                </p>
                {canEditName && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
                    onClick={() => handleStartEdit("name")}
                    aria-label="Editar nome"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

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

        {metaDiagnosticQuery.data?.enabled && metaIntegrationId && (
          <div className="flex items-start gap-3 border-t pt-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                Consentimento WhatsApp
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => consentMutation.mutate("GRANTED")}
                  disabled={consentMutation.isPending}
                >
                  Conceder opt-in
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => consentMutation.mutate("REVOKED")}
                  disabled={consentMutation.isPending}
                >
                  Revogar
                </Button>
              </div>
            </div>
          </div>
        )}

    </div>
  );

  return embedded ? content : <ScrollArea className="h-full">{content}</ScrollArea>;
};
