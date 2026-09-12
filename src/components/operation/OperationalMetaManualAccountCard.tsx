import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useOperationalMetaManualAccounts } from "@/hooks/useOperationalMetaManualAccounts";
import { usePermissions } from "@/hooks/usePermissions";
import {
  getOperationalStatusLabel,
} from "@/components/operation/operationalChannelLabels";
import { OperationalMetaAccountManager } from "@/components/operation/OperationalMetaAccountManager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function OperationalMetaManualAccountCard({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const { has, isCompanyLevel } = usePermissions();
  const accountsQuery = useOperationalMetaManualAccounts(workspaceId);
  const [managementOpen, setManagementOpen] = useState(false);

  const isCompanyAdmin = isCompanyLevel();
  const canManageManualAccount =
    isCompanyAdmin &&
    has("manage:integrations") &&
    has("manage:operation-channels");

  const accounts = accountsQuery.data ?? [];
  const needsAttention = accounts.some((account) =>
    ["ERROR", "NEEDS_REAUTHORIZATION"].includes(account.status),
  );
  const webhookPending = accounts.some(
    (account) => !account.webhookConfigured || !account.lastValidatedAt,
  );
  const isHealthy =
    !accountsQuery.isError &&
    accounts.length > 0 &&
    !needsAttention &&
    !webhookPending;
  const isUnavailable = accountsQuery.isError;
  const isMissing =
    !accountsQuery.isLoading && !accountsQuery.isError && !accounts.length;

  const openManagement = () => setManagementOpen(true);

  return (
    <div className="rounded-lg border bg-muted/10 px-3 py-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm font-medium">Credenciais da empresa</p>
          {isHealthy ? (
            <Badge variant="secondary">Em dia</Badge>
          ) : isUnavailable ? (
            <Badge variant="destructive">Indisponível</Badge>
          ) : needsAttention || webhookPending ? (
            <Badge variant="destructive">Requer atenção</Badge>
          ) : isMissing ? (
            <Badge variant="outline">Não configurada</Badge>
          ) : null}
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            {accountsQuery.isLoading
              ? "Consultando a configuração compartilhada pela empresa."
              : isUnavailable
                ? "Não foi possível consultar a conta Meta da empresa agora."
                : accounts.length
                  ? accounts
                      .map(
                        (account) =>
                          `${getOperationalStatusLabel(account.status)} · ${
                            account.phoneNumbers.length
                          } ${
                            account.phoneNumbers.length === 1
                              ? "número"
                              : "números"
                          }`,
                      )
                      .join(" · ")
                  : "A conta Meta da empresa ainda não foi configurada."}
          </p>
        </div>
        {canManageManualAccount ? (
          <Button
            size="sm"
            variant="ghost"
            className="w-full shrink-0 sm:w-auto"
            onClick={openManagement}
          >
            {isMissing ? (
              <>
                <KeyRound className="h-4 w-4" />
                Configurar conta Meta
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Gerenciar
              </>
            )}
          </Button>
        ) : null}
      </div>

      {!isHealthy && !canManageManualAccount && (needsAttention || webhookPending || isMissing || isUnavailable) ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Procure o administrador da empresa para concluir a configuração da
          conta Meta. Os números liberados podem ser escolhidos ao criar um
          canal.
        </p>
      ) : null}

      <Dialog open={managementOpen} onOpenChange={setManagementOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Credenciais da empresa</DialogTitle>
            <DialogDescription>
              Conta Meta da empresa: WABAs, webhook e números sincronizados
              reutilizados pelos workspaces.
            </DialogDescription>
          </DialogHeader>
          {managementOpen ? (
            <OperationalMetaAccountManager workspaceId={workspaceId} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
