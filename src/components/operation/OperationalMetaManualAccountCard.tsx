import { useState } from "react";
import { AlertTriangle, Settings2, ShieldCheck } from "lucide-react";
import { useOperationalMetaManualAccounts } from "@/hooks/useOperationalMetaManualAccounts";
import { usePermissions } from "@/hooks/usePermissions";
import { OperationalMetaAccountManager } from "@/components/operation/OperationalMetaAccountManager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OperationalMetaManualAccountCardProps = {
  workspaceId: string;
  presentation?: "trigger" | "notice";
};

export function OperationalMetaManualAccountCard({
  workspaceId,
  presentation = "notice",
}: OperationalMetaManualAccountCardProps) {
  const { has, isCompanyLevel } = usePermissions();
  const accountsQuery = useOperationalMetaManualAccounts(workspaceId);
  const [managementOpen, setManagementOpen] = useState(false);

  const canManageManualAccount =
    isCompanyLevel() &&
    has("manage:integrations") &&
    has("manage:operation-channels");
  const accounts = accountsQuery.data ?? [];
  const accountWithError = accounts.find((account) =>
    ["CONNECTING", "ERROR", "NEEDS_REAUTHORIZATION"].includes(account.status),
  );
  const accountWithPendingWebhook = accounts.find(
    (account) => !account.lastValidatedAt || !account.webhookConfigured,
  );
  const requiresAttention =
    accountsQuery.isError ||
    (!accountsQuery.isLoading && !accounts.length) ||
    Boolean(accountWithError || accountWithPendingWebhook);

  const dialog = (
    <Dialog open={managementOpen} onOpenChange={setManagementOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Configurações da Meta</DialogTitle>
          <DialogDescription>
            Gerencie as contas WhatsApp Business, os webhooks e os números
            compartilhados pela empresa.
          </DialogDescription>
        </DialogHeader>
        {managementOpen ? (
          <OperationalMetaAccountManager workspaceId={workspaceId} />
        ) : null}
      </DialogContent>
    </Dialog>
  );

  if (presentation === "trigger") {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => setManagementOpen(true)}
          aria-label={
            requiresAttention
              ? "Configurações da Meta, requer atenção"
              : "Configurações da Meta"
          }
        >
          <Settings2 className="h-4 w-4" />
          Configurações
          {requiresAttention ? (
            <span
              className="h-2 w-2 rounded-full bg-destructive"
              aria-hidden="true"
            />
          ) : null}
        </Button>
        {dialog}
      </>
    );
  }

  if (accountsQuery.isLoading || !requiresAttention) {
    return null;
  }

  const notice = accountsQuery.isError
    ? {
        title: "Não foi possível verificar a conta Meta",
        description:
          "Os canais existentes continuam disponíveis, mas novos números Meta não podem ser consultados agora.",
        destructive: true,
      }
    : !accounts.length
      ? {
          title: "Conta Meta ainda não configurada",
          description:
            "Configure a conta da empresa somente se pretende adicionar canais Meta Cloud.",
          destructive: false,
        }
      : accountWithError
        ? {
            title: "A conta Meta requer atenção",
            description:
              accountWithError.status === "NEEDS_REAUTHORIZATION"
                ? "Atualize as credenciais da empresa para voltar a usar seus números Meta."
                : accountWithError.status === "CONNECTING"
                  ? "A conta Meta ainda está conectando. Confirme o webhook e atualize o status antes de ativar novos canais."
                : "A última validação da conta Meta encontrou um problema.",
            destructive: true,
          }
        : {
            title: "Configuração Meta incompleta",
            description:
              "Conclua a validação e o webhook para liberar os números da empresa.",
            destructive: false,
          };

  return (
    <>
      <Alert variant={notice.destructive ? "destructive" : "default"}>
        {notice.destructive ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        <AlertTitle>{notice.title}</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{notice.description}</span>
          {canManageManualAccount ? (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => setManagementOpen(true)}
            >
              Resolver agora
            </Button>
          ) : (
            <span className="text-xs">
              Procure um administrador da empresa para concluir essa etapa.
            </span>
          )}
        </AlertDescription>
      </Alert>
      {dialog}
    </>
  );
}
