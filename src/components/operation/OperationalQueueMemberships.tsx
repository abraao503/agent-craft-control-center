import { useMemo, useState } from "react";
import { AxiosError } from "axios";
import { AlertCircle, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  useOperationalQueueMembershipMutations,
  useOperationalQueueMemberships,
} from "@/hooks/useOperationalQueueMemberships";
import { useToast } from "@/hooks/use-toast";
import { AreaMembership, QueueMembership } from "@/types/operation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OperationalQueueMembershipsProps = {
  workspaceId?: string;
  areaId: string;
  queueId: string;
  canManage: boolean;
  areaMemberships?: AreaMembership[];
  areaMembershipsLoading?: boolean;
  areaMembershipsError?: boolean;
};

export function OperationalQueueMemberships({
  workspaceId,
  areaId,
  queueId,
  canManage,
  areaMemberships = [],
  areaMembershipsLoading = false,
  areaMembershipsError = false,
}: OperationalQueueMembershipsProps) {
  const { toast } = useToast();
  const membershipsQuery = useOperationalQueueMemberships(
    workspaceId,
    areaId,
    queueId,
  );
  const mutations = useOperationalQueueMembershipMutations(
    workspaceId,
    areaId,
    queueId,
  );
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isManaging, setIsManaging] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<QueueMembership | null>(
    null,
  );

  const availableOperators = useMemo(() => {
    const activeMemberIds = new Set(
      membershipsQuery.data?.items.map((membership) => membership.userId),
    );

    return areaMemberships.filter(
      (membership) =>
        membership.role === "OPERATOR" &&
        membership.active &&
        membership.deletedAt === null &&
        !activeMemberIds.has(membership.userId),
    );
  }, [areaMemberships, membershipsQuery.data?.items]);

  const handleAdd = async () => {
    if (!selectedUserId) return;

    try {
      await mutations.upsert.mutateAsync({ userId: selectedUserId });
      toast({
        title: "Operador adicionado",
        description: "O operador agora está restrito a esta fila.",
      });
      setSelectedUserId("");
      setIsManaging(false);
    } catch (error) {
      toast({
        title: "Não foi possível adicionar o operador",
        description: getApiErrorMessage(
          error,
          "Verifique se a membership de área ainda está ativa e tente novamente.",
        ),
        variant: "destructive",
      });
    }
  };

  const handleRemove = async () => {
    if (!memberToRemove) return;

    try {
      await mutations.remove.mutateAsync({
        userId: memberToRemove.userId,
        expectedVersion: memberToRemove.version,
      });
      toast({
        title: "Operador liberado",
        description:
          "O operador deixou de ter uma restrição específica nesta fila.",
      });
      setMemberToRemove(null);
    } catch (error) {
      toast({
        title: "Não foi possível remover o operador",
        description: getApiErrorMessage(
          error,
          "A associação pode ter sido alterada por outra pessoa.",
        ),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="pt-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium">
            {!membershipsQuery.isSuccess
              ? "Consultando operadores…"
              : membershipsQuery.data?.total
                ? "Operadores restritos"
                : "Operadores"}
          </p>
          <p className="text-xs text-muted-foreground">
            {!membershipsQuery.isSuccess
              ? "Avaliando as restrições atuais desta fila."
              : membershipsQuery.data?.total
                ? "Somente os operadores listados podem atuar nesta fila."
                : "Todos os operadores desta área podem atuar nesta fila."}
          </p>
        </div>
        {canManage ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsManaging((open) => !open)}
            aria-expanded={isManaging}
          >
            <Plus className="mr-2 h-4 w-4" />
            {isManaging
              ? "Fechar"
              : membershipsQuery.data?.total
                ? "Gerenciar"
                : "Restringir operadores"}
          </Button>
        ) : null}
      </div>

      {canManage && isManaging && (
        <div className="mt-2 rounded-md border bg-muted/20 p-2">
          {areaMembershipsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                Não foi possível carregar operadores da área
              </AlertTitle>
              <AlertDescription>
                Atualize a lista de memberships da área para tentar novamente.
              </AlertDescription>
            </Alert>
          ) : areaMembershipsLoading ? (
            <div className="flex min-h-9 items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando operadores elegíveis...
            </div>
          ) : availableOperators.length ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-1">
                <label
                  className="text-xs font-medium"
                  htmlFor={`operational-queue-member-user-${queueId}`}
                >
                  Operador
                </label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger
                    id={`operational-queue-member-user-${queueId}`}
                  >
                    <SelectValue placeholder="Selecione um operador" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOperators.map((areaMembership) => (
                      <SelectItem
                        key={areaMembership.userId}
                        value={areaMembership.userId}
                      >
                        {areaMembership.user.name} · {areaMembership.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleAdd()}
                disabled={!selectedUserId || mutations.upsert.isPending}
              >
                {mutations.upsert.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Restringir
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Associe primeiro um operador à área ou todos os operadores já
              estão restritos a esta fila.
            </p>
          )}
        </div>
      )}

      <div className="mt-2">
        {membershipsQuery.isLoading ? (
          <div className="flex min-h-10 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="sr-only">Carregando restrições</span>
          </div>
        ) : membershipsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Não foi possível carregar as restrições</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              Tente novamente quando a API estiver disponível.
              <Button
                size="sm"
                variant="outline"
                onClick={() => membershipsQuery.refetch()}
                disabled={membershipsQuery.isFetching}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : membershipsQuery.data?.items.length ? (
          <div className="divide-y rounded-md border">
            {membershipsQuery.data.items.map((membership) => (
              <div
                key={membership.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">
                    {membership.user.name}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {membership.user.email}
                  </p>
                </div>
                {canManage && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    aria-label={`Liberar ${membership.user.name} da fila`}
                    onClick={() => setMemberToRemove(membership)}
                    disabled={mutations.remove.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="py-1 text-xs text-muted-foreground">
            Sem restrições específicas.
          </p>
        )}
      </div>

      <AlertDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => {
          if (!open && !mutations.remove.isPending) setMemberToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Liberar operador da fila?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove?.user.name} voltará ao escopo geral da área para
              esta fila. O histórico do vínculo será preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutations.remove.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleRemove();
              }}
              disabled={mutations.remove.isPending}
            >
              {mutations.remove.isPending ? "Liberando..." : "Liberar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof AxiosError)) return fallback;

  const code = error.response?.data?.message;
  const messages: Record<string, string> = {
    AREA_MEMBERSHIP_NOT_FOUND:
      "O operador não possui mais uma membership ativa nesta área.",
    MEMBERSHIP_NOT_FOUND: "O vínculo de fila não existe mais.",
    QUEUE_NOT_FOUND: "A fila não está mais ativa ou não pertence a esta área.",
    USER_NOT_ELIGIBLE: "Somente operadores elegíveis podem ser restritos.",
    STALE_VERSION:
      "O vínculo foi alterado por outra pessoa. Atualize a lista e tente novamente.",
  };

  return typeof code === "string" && messages[code] ? messages[code] : fallback;
}
