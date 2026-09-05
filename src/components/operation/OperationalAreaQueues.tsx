import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  AlertCircle,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  useOperationalQueueMutations,
  useOperationalQueues,
} from "@/hooks/useOperationalQueues";
import { useOperationalAreaMemberships } from "@/hooks/useOperationalAreaMemberships";
import { useToast } from "@/hooks/use-toast";
import { ServiceQueue } from "@/types/operation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OperationalQueueMemberships } from "@/components/operation/OperationalQueueMemberships";

type QueueForm = {
  name: string;
  description: string;
};

type OperationalAreaQueuesProps = {
  workspaceId?: string;
  areaId: string;
  canManage: boolean;
  canManageMemberships?: boolean;
};

export function OperationalAreaQueues({
  workspaceId,
  areaId,
  canManage,
  canManageMemberships = false,
}: OperationalAreaQueuesProps) {
  const { toast } = useToast();
  const queuesQuery = useOperationalQueues(workspaceId, areaId);
  const areaMembershipsQuery = useOperationalAreaMemberships(
    workspaceId,
    areaId,
  );
  const mutations = useOperationalQueueMutations(workspaceId, areaId);
  const [editingQueue, setEditingQueue] = useState<ServiceQueue | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [queueToDelete, setQueueToDelete] = useState<ServiceQueue | null>(null);

  const handleSubmit = async (form: QueueForm) => {
    try {
      if (editingQueue) {
        await mutations.update.mutateAsync({
          queueId: editingQueue.id,
          name: form.name,
          description: form.description || null,
          expectedVersion: editingQueue.version,
        });
        toast({
          title: "Fila atualizada",
          description: "A fila foi atualizada com sucesso.",
        });
      } else {
        await mutations.create.mutateAsync({
          name: form.name,
          description: form.description || undefined,
        });
        toast({
          title: "Fila criada",
          description: "A fila foi criada com sucesso.",
        });
      }

      setIsDialogOpen(false);
      setEditingQueue(null);
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

  const handleDelete = async () => {
    if (!queueToDelete) return;

    try {
      await mutations.remove.mutateAsync({
        queueId: queueToDelete.id,
        expectedVersion: queueToDelete.version,
      });
      toast({
        title: "Fila desativada",
        description: "A fila foi desativada sem apagar seu histórico.",
      });
      setQueueToDelete(null);
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

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Filas</p>
          <p className="text-xs text-muted-foreground">
            Organize o atendimento dentro desta área. Somente filas ativas são
            exibidas.
          </p>
        </div>
        {canManage && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingQueue(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova fila
          </Button>
        )}
      </div>

      <div className="mt-3">
        {queuesQuery.isLoading ? (
          <div className="flex min-h-16 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="sr-only">Carregando filas</span>
          </div>
        ) : queuesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Não foi possível carregar as filas</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              Tente novamente quando a API estiver disponível.
              <Button
                size="sm"
                variant="outline"
                onClick={() => queuesQuery.refetch()}
                disabled={queuesQuery.isFetching}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : queuesQuery.data?.items.length ? (
          <Accordion type="single" collapsible className="overflow-hidden rounded-md border">
            {queuesQuery.data.items.map((queue) => (
              <AccordionItem
                key={queue.id}
                value={queue.id}
                className="px-3 last:border-b-0"
              >
                <div className="flex items-center gap-1">
                  <div className="min-w-0 flex-1">
                    <AccordionTrigger className="w-full min-w-0 py-3 text-left hover:no-underline">
                      <span className="min-w-0 pr-2">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{queue.name}</span>
                          <Badge variant="secondary">Ativa</Badge>
                        </span>
                        {queue.description ? (
                          <span className="mt-1 line-clamp-1 block text-xs font-normal text-muted-foreground">
                            {queue.description}
                          </span>
                        ) : null}
                      </span>
                    </AccordionTrigger>
                  </div>
                  {canManage ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingQueue(queue);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9"
                            aria-label={`Mais ações para ${queue.name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setQueueToDelete(queue)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Desativar fila
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : null}
                </div>
                <AccordionContent className="border-t">
                  <OperationalQueueMemberships
                    workspaceId={workspaceId}
                    areaId={areaId}
                    queueId={queue.id}
                    canManage={canManageMemberships}
                    areaMemberships={areaMembershipsQuery.data?.items}
                    areaMembershipsLoading={areaMembershipsQuery.isLoading}
                    areaMembershipsError={areaMembershipsQuery.isError}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-center">
            <p className="text-sm font-medium">Nenhuma fila ativa</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crie a primeira fila desta área para continuar a estruturação.
            </p>
          </div>
        )}
      </div>

      <OperationalQueueDialog
        open={isDialogOpen}
        queue={editingQueue}
        inputId={`operational-queue-name-${areaId}`}
        isPending={mutations.create.isPending || mutations.update.isPending}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingQueue(null);
        }}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(queueToDelete)}
        onOpenChange={(open) => {
          if (!open && !mutations.remove.isPending) setQueueToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar fila?</AlertDialogTitle>
            <AlertDialogDescription>
              A fila “{queueToDelete?.name}” ficará fora das listagens ativas,
              mas seu histórico será preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutations.remove.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={mutations.remove.isPending}
            >
              {mutations.remove.isPending ? "Desativando..." : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function OperationalQueueDialog({
  open,
  queue,
  inputId,
  isPending,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  queue: ServiceQueue | null;
  inputId: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (form: QueueForm) => Promise<void>;
}) {
  const [form, setForm] = useState<QueueForm>({ name: "", description: "" });

  useEffect(() => {
    setForm({
      name: queue?.name ?? "",
      description: queue?.description ?? "",
    });
  }, [open, queue]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{queue ? "Editar fila" : "Nova fila"}</DialogTitle>
          <DialogDescription>
            Informe um nome único entre as filas ativas desta área.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={inputId}>Nome *</Label>
            <Input
              id={inputId}
              value={form.name}
              maxLength={160}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              disabled={isPending}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${inputId}-description`}>Descrição</Label>
            <Textarea
              id={`${inputId}-description`}
              value={form.description}
              maxLength={500}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !form.name.trim()}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof AxiosError)) return fallback;

  const code = error.response?.data?.message;
  const messages: Record<string, string> = {
    AREA_NOT_FOUND:
      "A área não está mais ativa ou não pertence a este ambiente.",
    QUEUE_NAME_CONFLICT: "Já existe uma fila ativa com esse nome nesta área.",
    STALE_VERSION:
      "A fila foi alterada por outra pessoa. Atualize a lista e tente novamente.",
  };

  return typeof code === "string" && messages[code] ? messages[code] : fallback;
}
