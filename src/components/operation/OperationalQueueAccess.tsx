import { useMemo, useState } from "react";
import { AxiosError } from "axios";
import { Link } from "react-router-dom";
import { AlertCircle, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useOperationalAreaMemberships } from "@/hooks/useOperationalAreaMemberships";
import {
  useOperationalQueueMembershipMutations,
  useOperationalQueueMemberships,
} from "@/hooks/useOperationalQueueMemberships";
import { useToast } from "@/hooks/use-toast";
import { QueueMembership } from "@/types/operation";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OperationalQueueAccessProps = {
  workspaceId: string;
  areaId: string;
  queueId: string;
  canView: boolean;
  canManage: boolean;
};

export function OperationalQueueAccess({
  workspaceId,
  areaId,
  queueId,
  canView,
  canManage,
}: OperationalQueueAccessProps) {
  const { toast } = useToast();
  const queueMembershipsQuery = useOperationalQueueMemberships(
    canView ? workspaceId : undefined,
    canView ? areaId : undefined,
    canView ? queueId : undefined,
    1,
    100,
  );
  const areaMembershipsQuery = useOperationalAreaMemberships(
    canView ? workspaceId : undefined,
    canView ? areaId : undefined,
    1,
    100,
  );
  const mutations = useOperationalQueueMembershipMutations(
    workspaceId,
    areaId,
    queueId,
  );
  const [isManaging, setIsManaging] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<QueueMembership | null>(
    null,
  );

  const queueMemberships = queueMembershipsQuery.data?.items ?? [];
  const activeRestrictionCount = queueMembershipsQuery.data?.total ?? 0;
  const availableOperators = useMemo(() => {
    const restrictedUserIds = new Set(
      queueMemberships.map((membership) => membership.userId),
    );

    return (areaMembershipsQuery.data?.items ?? []).filter(
      (membership) =>
        membership.role === "OPERATOR" &&
        membership.active &&
        membership.deletedAt === null &&
        !restrictedUserIds.has(membership.userId),
    );
  }, [areaMembershipsQuery.data?.items, queueMemberships]);

  if (!canView) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Acesso de operadores</AlertTitle>
        <AlertDescription>
          Você não tem permissão para consultar as memberships desta fila.
        </AlertDescription>
      </Alert>
    );
  }

  const isLoaded = queueMembershipsQuery.isSuccess;
  const isRestricted = isLoaded && activeRestrictionCount > 0;

  const handleAdd = async () => {
    if (!selectedUserId) return;

    try {
      await mutations.upsert.mutateAsync({ userId: selectedUserId });
      await queueMembershipsQuery.refetch();
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
      await queueMembershipsQuery.refetch();
      toast({
        title: "Restrição removida",
        description:
          "O operador voltou ao escopo geral de operadores da área.",
      });
      setMemberToRemove(null);
    } catch (error) {
      toast({
        title: "Não foi possível remover a restrição",
        description: getApiErrorMessage(
          error,
          "A associação pode ter sido alterada por outra pessoa.",
        ),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">
              {!isLoaded
                ? "Consultando operadores…"
                : isRestricted
                  ? "Somente operadores selecionados"
                  : "Todos os operadores da área"}
            </p>
            <Badge
              variant={!isLoaded || isRestricted ? "secondary" : "outline"}
            >
              {!isLoaded
                ? "Consultando…"
                : isRestricted
                  ? "Restrito"
                  : "Aberto"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {!isLoaded
              ? "A definição de acesso será exibida quando a consulta terminar."
              : isRestricted
                ? "Somente os operadores listados abaixo podem atuar nesta fila."
                : "Todos os operadores ativos desta área podem atuar nesta fila."}
          </p>
        </div>
        {canManage && isLoaded ? (
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
              : isRestricted
                ? "Gerenciar acesso"
                : "Restringir operadores"}
          </Button>
        ) : null}
      </div>

      {queueMembershipsQuery.isPending ? (
        <Card>
          <CardContent className="flex min-h-20 items-center gap-2 p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Consultando operadores…
          </CardContent>
        </Card>
      ) : queueMembershipsQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível consultar o acesso</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            Tente novamente para verificar quem pode atuar nesta fila.
            <Button
              size="sm"
              variant="outline"
              onClick={() => queueMembershipsQuery.refetch()}
              disabled={queueMembershipsQuery.isFetching}
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : isRestricted ? (
        <div className="divide-y rounded-lg border">
          {queueMemberships.map((membership) => (
            <div
              key={membership.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{membership.user.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {membership.user.email}
                </p>
              </div>
              {canManage ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  aria-label={"Remover restrição de " + membership.user.name}
                  onClick={() => setMemberToRemove(membership)}
                  disabled={mutations.remove.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Não há restrições específicas nesta fila.
        </div>
      )}

      {canManage && isManaging && isLoaded ? (
        <Card className="bg-muted/20">
          <CardContent className="space-y-3 p-4">
            {areaMembershipsQuery.isPending ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Consultando operadores elegíveis...
              </div>
            ) : areaMembershipsQuery.isError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  Não foi possível carregar operadores da área
                </AlertTitle>
                <AlertDescription className="flex flex-wrap items-center gap-3">
                  Atualize a lista de operadores para tentar novamente.
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => areaMembershipsQuery.refetch()}
                    disabled={areaMembershipsQuery.isFetching}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Tentar novamente
                  </Button>
                </AlertDescription>
              </Alert>
            ) : availableOperators.length ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor={"queue-access-operator-" + queueId}
                  >
                    Operador elegível
                  </label>
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                  >
                    <SelectTrigger id={"queue-access-operator-" + queueId}>
                      <SelectValue placeholder="Selecione um operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOperators.map((membership) => (
                        <SelectItem
                          key={membership.userId}
                          value={membership.userId}
                        >
                          {membership.user.name} · {membership.user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  onClick={() => void handleAdd()}
                  disabled={!selectedUserId || mutations.upsert.isPending}
                >
                  {mutations.upsert.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Restringir operador
                </Button>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Nenhum operador elegível</AlertTitle>
                <AlertDescription>
                  Associe um operador ativo à área antes de restringir o acesso
                  desta fila.{" "}
                  <Link
                    to={"/operation/areas/" + areaId + "?tab=team"}
                    className="font-medium underline underline-offset-4"
                  >
                    Ir para Equipe da área
                  </Link>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : null}

      <AlertDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => {
          if (!open && !mutations.remove.isPending) setMemberToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {queueMembershipsQuery.data?.total === 1
                ? "Remover a última restrição?"
                : "Remover restrição?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {queueMembershipsQuery.data?.total === 1
                ? "Esta é a última restrição da fila. Ao remover " +
                  (memberToRemove?.user.name ?? "este operador") +
                  ", todos os operadores ativos da área poderão atuar nesta fila."
                : (memberToRemove?.user.name ?? "Este operador") +
                  " voltará ao escopo geral de operadores da área para esta fila."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutations.remove.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={mutations.remove.isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleRemove();
              }}
            >
              {mutations.remove.isPending
                ? "Removendo..."
                : "Remover restrição"}
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
    STALE_VERSION:
      "O vínculo foi alterado por outra pessoa. Atualize a lista e tente novamente.",
    USER_NOT_ELIGIBLE: "Somente operadores elegíveis podem ser restritos.",
  };

  return typeof code === "string" && messages[code] ? messages[code] : fallback;
}
