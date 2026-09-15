import { useState } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Inbox, Pencil } from "lucide-react";
import { useOperationalQueueMutations } from "@/hooks/useOperationalQueues";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { ServiceArea, ServiceQueue } from "@/types/operation";
import {
  OperationalQueueFormDialog,
  OperationalQueueFormValues,
} from "@/components/operation/OperationalQueueFormDialog";
import { OperationalQueueAccess } from "@/components/operation/OperationalQueueAccess";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type OperationalQueueDetailProps = {
  workspaceId: string;
  area: ServiceArea;
  queue: ServiceQueue;
  onReload: () => Promise<unknown>;
};

export function OperationalQueueDetail({
  workspaceId,
  area,
  queue,
  onReload,
}: OperationalQueueDetailProps) {
  const navigate = useNavigate();
  const { has } = usePermissions();
  const { toast } = useToast();
  const canManage = has("manage:operation-setup");
  const canViewMemberships = has("view:operation-memberships");
  const canManageMemberships = has("manage:operation-memberships");
  const mutations = useOperationalQueueMutations(workspaceId, area.id);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);

  const handleSubmit = async (values: OperationalQueueFormValues) => {
    try {
      await mutations.update.mutateAsync({
        queueId: queue.id,
        name: values.name,
        description: values.description || null,
        expectedVersion: queue.version,
      });
      await onReload();
      toast({
        title: "Fila atualizada",
        description: "As informações da fila foram atualizadas.",
      });
      setIsFormOpen(false);
    } catch (error) {
      toast({
        title: "Não foi possível salvar a fila",
        description: getApiErrorMessage(
          error,
          "A fila pode ter sido alterada por outra pessoa.",
        ),
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async () => {
    try {
      await mutations.remove.mutateAsync({
        queueId: queue.id,
        expectedVersion: queue.version,
      });
      toast({
        title: "Fila desativada",
        description: "A fila foi retirada da estrutura ativa.",
      });
      navigate("/operation/areas/" + area.id);
    } catch (error) {
      toast({
        title: "Não foi possível desativar a fila",
        description: getApiErrorMessage(
          error,
          "A fila pode ter sido alterada por outra pessoa.",
        ),
        variant: "destructive",
      });
      setIsDeactivateOpen(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1100px] space-y-6">
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground"
      >
        <Link
          to="/operation"
          className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Operação
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to="/operation/structure"
          className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Estrutura
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to={"/operation/areas/" + area.id}
          className="max-w-[14rem] truncate rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {area.name}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="max-w-full truncate text-foreground">{queue.name}</span>
      </nav>

      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Inbox className="h-6 w-6 shrink-0 text-primary" />
            <h1 className="truncate text-3xl font-semibold tracking-tight">
              {queue.name}
            </h1>
            <Badge variant="secondary">Ativa</Badge>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {queue.description || "Sem descrição cadastrada para esta fila."}
          </p>
        </div>
        {canManage ? (
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
            <Button variant="outline" onClick={() => setIsFormOpen(true)}>
              <Pencil className="h-4 w-4" />
              Editar fila
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setIsDeactivateOpen(true)}
            >
              Desativar fila
            </Button>
          </div>
        ) : null}
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Origem da fila</CardTitle>
          <CardDescription>
            Esta fila pertence à área operacional abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to={"/operation/areas/" + area.id}
            className="flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{area.name}</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                Ver filas e equipe da área
              </span>
            </span>
            <ArrowLeft className="h-4 w-4 rotate-180 shrink-0 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quem pode atuar nesta fila</CardTitle>
          <CardDescription>
            Controle quais operadores ativos da área podem receber atendimentos
            desta fila.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OperationalQueueAccess
            workspaceId={workspaceId}
            areaId={area.id}
            queueId={queue.id}
            canView={canViewMemberships}
            canManage={canManageMemberships}
          />
        </CardContent>
      </Card>

      <Button asChild variant="ghost" className="px-0">
        <Link to={"/operation/areas/" + area.id}>
          <ArrowLeft className="h-4 w-4" />
          Voltar para {area.name}
        </Link>
      </Button>

      <OperationalQueueFormDialog
        open={isFormOpen}
        queue={queue}
        isPending={mutations.update.isPending}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={isDeactivateOpen}
        onOpenChange={(open) => {
          if (!open && !mutations.remove.isPending) setIsDeactivateOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar fila?</AlertDialogTitle>
            <AlertDialogDescription>
              A fila “{queue.name}” ficará fora da estrutura ativa. O histórico
              será preservado.
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
    </section>
  );
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof AxiosError)) return fallback;

  const code = error.response?.data?.message;
  const messages: Record<string, string> = {
    AREA_NOT_FOUND: "A área não está mais ativa ou não pertence a este ambiente.",
    QUEUE_NAME_CONFLICT: "Já existe uma fila ativa com esse nome nesta área.",
    QUEUE_NOT_FOUND: "A fila não está mais ativa ou não pertence a esta área.",
    STALE_VERSION:
      "A fila foi alterada por outra pessoa. Atualize e tente novamente.",
  };

  return typeof code === "string" && messages[code] ? messages[code] : fallback;
}
