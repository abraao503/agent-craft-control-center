import { useMemo, useState } from "react";
import { AxiosError } from "axios";
import { AlertCircle, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  useOperationalAreaMembershipMutations,
  useOperationalAreaMemberships,
} from "@/hooks/useOperationalAreaMemberships";
import { useToast } from "@/hooks/use-toast";
import { AreaMembership, AreaMembershipRole } from "@/types/operation";
import { User } from "@/types/user";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OperationalAreaMembershipsProps = {
  workspaceId?: string;
  areaId: string;
  canManage: boolean;
  candidateUsers?: User[];
  candidatesLoading?: boolean;
  candidatesError?: boolean;
};

const roleLabels: Record<AreaMembershipRole, string> = {
  OPERATOR: "Operador",
  SUPERVISOR: "Supervisor",
};

export function OperationalAreaMemberships({
  workspaceId,
  areaId,
  canManage,
  candidateUsers = [],
  candidatesLoading = false,
  candidatesError = false,
}: OperationalAreaMembershipsProps) {
  const { toast } = useToast();
  const membershipsQuery = useOperationalAreaMemberships(workspaceId, areaId);
  const mutations = useOperationalAreaMembershipMutations(workspaceId, areaId);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] =
    useState<AreaMembershipRole>("OPERATOR");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] =
    useState<AreaMembership | null>(null);

  const availableUsers = useMemo(() => {
    const activeMemberIds = new Set(
      membershipsQuery.data?.items.map((membership) => membership.userId),
    );

    return candidateUsers.filter(
      (user) =>
        user.role === "WORKSPACE_MEMBER" && !activeMemberIds.has(user.id),
    );
  }, [candidateUsers, membershipsQuery.data?.items]);

  const handleAdd = async () => {
    if (!selectedUserId) return;

    try {
      await mutations.upsert.mutateAsync({
        userId: selectedUserId,
        role: selectedRole,
      });
      toast({
        title: "Membro adicionado",
        description: "O usuário agora pertence a esta área operacional.",
      });
      setSelectedUserId("");
      setIsAddOpen(false);
    } catch (error) {
      toast({
        title: "Não foi possível adicionar o membro",
        description: getApiErrorMessage(
          error,
          "Verifique se o usuário ainda está elegível e tente novamente.",
        ),
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (
    membership: AreaMembership,
    role: AreaMembershipRole,
  ) => {
    if (role === membership.role) return;

    try {
      await mutations.upsert.mutateAsync({
        userId: membership.userId,
        role,
        expectedVersion: membership.version,
      });
      toast({
        title: "Papel atualizado",
        description: `${membership.user.name} agora é ${roleLabels[role].toLocaleLowerCase()} nesta área.`,
      });
    } catch (error) {
      toast({
        title: "Não foi possível atualizar o papel",
        description: getApiErrorMessage(
          error,
          "A associação pode ter sido alterada por outra pessoa.",
        ),
        variant: "destructive",
      });
      void membershipsQuery.refetch();
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
        title: "Membro removido",
        description: "O acesso do usuário a esta área foi desativado.",
      });
      setMemberToRemove(null);
    } catch (error) {
      toast({
        title: "Não foi possível remover o membro",
        description: getApiErrorMessage(
          error,
          "A associação pode ter sido alterada por outra pessoa.",
        ),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Membros da área</p>
          <p className="text-xs text-muted-foreground">
            Defina quem atua nesta área e qual é o papel operacional.
          </p>
        </div>
        {canManage ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsAddOpen((open) => !open)}
            aria-expanded={isAddOpen}
          >
            <Plus className="mr-2 h-4 w-4" />
            {isAddOpen ? "Fechar" : "Adicionar membro"}
          </Button>
        ) : null}
      </div>

      {canManage && isAddOpen && (
        <div className="mt-3 rounded-md border bg-muted/20 p-3">
          {candidatesError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Não foi possível carregar usuários elegíveis</AlertTitle>
              <AlertDescription>
                Atualize a página para tentar novamente.
              </AlertDescription>
            </Alert>
          ) : candidatesLoading ? (
            <div className="flex min-h-10 items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando usuários elegíveis...
            </div>
          ) : availableUsers.length ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-2">
                <label
                  className="text-xs font-medium"
                  htmlFor={`operational-member-user-${areaId}`}
                >
                  Usuário
                </label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger id={`operational-member-user-${areaId}`}>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} · {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full space-y-2 sm:w-40">
                <label
                  className="text-xs font-medium"
                  htmlFor={`operational-member-role-${areaId}`}
                >
                  Papel
                </label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) =>
                    setSelectedRole(value as AreaMembershipRole)
                  }
                >
                  <SelectTrigger id={`operational-member-role-${areaId}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATOR">Operador</SelectItem>
                    <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleAdd()}
                disabled={!selectedUserId || mutations.upsert.isPending}
              >
                {mutations.upsert.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Adicionar
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Não há usuários `WORKSPACE_MEMBER` disponíveis para adicionar.
            </p>
          )}
        </div>
      )}

      <div className="mt-3">
        {membershipsQuery.isLoading ? (
          <div className="flex min-h-16 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="sr-only">Carregando membros</span>
          </div>
        ) : membershipsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Não foi possível carregar os membros</AlertTitle>
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
                className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {membership.user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {membership.user.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canManage ? (
                    <Select
                      value={membership.role}
                      onValueChange={(value) =>
                        void handleRoleChange(
                          membership,
                          value as AreaMembershipRole,
                        )
                      }
                      disabled={mutations.upsert.isPending}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPERATOR">Operador</SelectItem>
                        <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary">
                      {roleLabels[membership.role]}
                    </Badge>
                  )}
                  {canManage && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Remover ${membership.user.name} da área`}
                      onClick={() => setMemberToRemove(membership)}
                      disabled={mutations.remove.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-2 text-sm text-muted-foreground">
            Nenhum membro ativo nesta área.
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
            <AlertDialogTitle>Remover membro da área?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove?.user.name} perderá o vínculo ativo com esta área.
              O histórico da associação será preservado.
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
              {mutations.remove.isPending ? "Removendo..." : "Remover"}
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
    AREA_NOT_FOUND: "A área não está mais ativa ou não pertence a este workspace.",
    USER_NOT_FOUND: "O usuário não pertence a este workspace.",
    USER_NOT_ELIGIBLE: "Somente usuários WORKSPACE_MEMBER podem ser associados.",
    STALE_VERSION:
      "A associação foi alterada por outra pessoa. Atualize a lista e tente novamente.",
  };

  return typeof code === "string" && messages[code] ? messages[code] : fallback;
}
