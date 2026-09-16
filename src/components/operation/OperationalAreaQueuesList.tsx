import { useState } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  useOperationalQueueMutations,
  useOperationalQueues,
} from "@/hooks/useOperationalQueues";
import { useToast } from "@/hooks/use-toast";
import { ServiceQueue } from "@/types/operation";
import { OperationalQueueFormDialog, OperationalQueueFormValues } from "@/components/operation/OperationalQueueFormDialog";
import { SmartPagination } from "@/components/common/SmartPagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const QUEUES_PAGE_SIZE = 20;

type OperationalAreaQueuesListProps = {
  workspaceId?: string;
  areaId: string;
  canManage: boolean;
};

export function OperationalAreaQueuesList({
  workspaceId,
  areaId,
  canManage,
}: OperationalAreaQueuesListProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [editingQueue, setEditingQueue] = useState<ServiceQueue | null>(null);
  const [queueToDeactivate, setQueueToDeactivate] =
    useState<ServiceQueue | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queuesQuery = useOperationalQueues(
    workspaceId,
    areaId,
    page,
    QUEUES_PAGE_SIZE,
  );
  const mutations = useOperationalQueueMutations(workspaceId, areaId);

  const handleSubmit = async (values: OperationalQueueFormValues) => {
    try {
      if (editingQueue) {
        await mutations.update.mutateAsync({
          queueId: editingQueue.id,
          name: values.name,
          description: values.description || null,
          expectedVersion: editingQueue.version,
        });
        toast({
          title: "Fila atualizada",
          description: "As informações da fila foram atualizadas.",
        });
        setIsFormOpen(false);
        setEditingQueue(null);
        return;
      }

      const createdQueue = await mutations.create.mutateAsync({
        name: values.name,
        description: values.description || undefined,
      });
      toast({
        title: "Fila criada",
        description: "A fila foi criada e está pronta para configurar o acesso.",
      });
      setIsFormOpen(false);
      navigate(`/operation/areas/${areaId}/queues/${createdQueue.id}`);
    } catch (error) {
      toast({
        title: "Não foi possível salvar a fila",
        description: getApiErrorMessage(
          error,
          "Verifique os dados e tente novamente.",
        ),
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async () => {
    if (!queueToDeactivate) return;

    try {
      await mutations.remove.mutateAsync({
        queueId: queueToDeactivate.id,
        expectedVersion: queueToDeactivate.version,
      });
      toast({
        title: "Fila desativada",
        description: "A fila foi retirada da estrutura ativa.",
      });
      setQueueToDeactivate(null);
      if (queuesQuery.data?.items.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      }
    } catch (error) {
      toast({
        title: "Não foi possível desativar a fila",
        description: getApiErrorMessage(
          error,
          "A fila pode ter sido alterada por outra pessoa.",
        ),
        variant: "destructive",
      });
    }
  };

  if (queuesQuery.isLoading) {
    return (
      <div className="flex min-h-36 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando filas...
      </div>
    );
  }

  if (queuesQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Não foi possível carregar as filas</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          Tente novamente quando a API estiver disponível.
          <Button
            size="sm"
            variant="outline"
            onClick={() => queuesQuery.refetch()}
            disabled={queuesQuery.isFetching}
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const queues = queuesQuery.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Filas desta área</h2>
          <p className="text-sm text-muted-foreground">
            {queuesQuery.data?.total ?? 0} {queuesQuery.data?.total === 1 ? "fila ativa" : "filas ativas"}
          </p>
        </div>
        {canManage ? (
          <Button
            size="sm"
            onClick={() => {
              setEditingQueue(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nova fila
          </Button>
        ) : null}
      </div>

      {queues.length ? (
        <div className="divide-y overflow-hidden rounded-lg border">
          {queues.map((queue) => (
            <div
              key={queue.id}
              className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap sm:gap-4"
            >
              <Link
                to={`/operation/areas/${areaId}/queues/${queue.id}`}
                className="group min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate font-medium group-hover:text-primary">
                    {queue.name}
                  </span>
                  <Badge variant="secondary">Ativa</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {queue.description || "Sem descrição cadastrada."}
                </p>
              </Link>
              <div className="flex w-full shrink-0 items-center justify-end gap-1 sm:w-auto">
                {canManage ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`Editar ${queue.name}`}
                      onClick={() => {
                        setEditingQueue(queue);
                        setIsFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Desativar ${queue.name}`}
                      onClick={() => setQueueToDeactivate(queue)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Desativar</span>
                    </Button>
                  </>
                ) : null}
                <Button asChild size="sm" variant="outline">
                  <Link to={`/operation/areas/${areaId}/queues/${queue.id}`}>
                    <span className="hidden sm:inline">Abrir</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">Nenhuma fila ativa</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie a primeira fila desta área para começar a distribuir o atendimento.
          </p>
          {canManage ? (
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => {
                setEditingQueue(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Criar fila
            </Button>
          ) : null}
        </div>
      )}

      <SmartPagination
        currentPage={(queuesQuery.data?.page ?? page) - 1}
        totalPages={queuesQuery.data?.totalPages ?? 0}
        onPageChange={(nextPage) => setPage(nextPage + 1)}
        showItemCount
        itemsPerPage={queuesQuery.data?.limit ?? QUEUES_PAGE_SIZE}
        totalItems={queuesQuery.data?.total ?? 0}
        itemLabel="filas"
      />

      <OperationalQueueFormDialog
        open={isFormOpen}
        queue={editingQueue}
        isPending={mutations.create.isPending || mutations.update.isPending}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingQueue(null);
        }}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(queueToDeactivate)}
        onOpenChange={(open) => {
          if (!open && !mutations.remove.isPending) setQueueToDeactivate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar fila?</AlertDialogTitle>
            <AlertDialogDescription>
              A fila “{queueToDeactivate?.name}” ficará fora da estrutura ativa.
              O histórico será preservado.
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
                void handleDeactivate();
              }}
            >
              {mutations.remove.isPending ? "Desativando..." : "Desativar"}
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
    AREA_NOT_FOUND: "A área não está mais ativa ou não pertence a este ambiente.",
    QUEUE_NAME_CONFLICT: "Já existe uma fila ativa com esse nome nesta área.",
    STALE_VERSION:
      "A fila foi alterada por outra pessoa. Atualize a lista e tente novamente.",
  };

  return typeof code === "string" && messages[code] ? messages[code] : fallback;
}
