import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import {
  useOperationalAreaMutations,
  useOperationalAreas,
} from "@/hooks/useOperationalAreas";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { ServiceArea } from "@/types/operation";
import { OperationalAreaFormDialog, OperationalAreaFormValues } from "@/components/operation/OperationalAreaFormDialog";
import { OperationalAreaList } from "@/components/operation/OperationalAreaList";
import { SmartPagination } from "@/components/common/SmartPagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const AREAS_PAGE_SIZE = 20;

export default function OperationStructurePage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const { toast } = useToast();
  const navigate = useNavigate();
  const workspaceId =
    currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const canManage = has("manage:operation-setup");
  const [page, setPage] = useState(1);
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null);
  const [areaToDeactivate, setAreaToDeactivate] = useState<ServiceArea | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);

  const areasQuery = useOperationalAreas(workspaceId, page, AREAS_PAGE_SIZE);
  const mutations = useOperationalAreaMutations(workspaceId);

  useEffect(() => {
    setPage(1);
  }, [workspaceId]);

  const openCreate = () => {
    setEditingArea(null);
    setIsFormOpen(true);
  };

  const openEdit = (area: ServiceArea) => {
    setEditingArea(area);
    setIsFormOpen(true);
  };

  const handleSubmit = async (values: OperationalAreaFormValues) => {
    try {
      if (editingArea) {
        await mutations.update.mutateAsync({
          areaId: editingArea.id,
          name: values.name,
          description: values.description || null,
          expectedVersion: editingArea.version,
        });
        toast({
          title: "Área atualizada",
          description: "As informações da área foram atualizadas.",
        });
      } else {
        const createdArea = await mutations.create.mutateAsync({
          name: values.name,
          description: values.description || undefined,
        });
        toast({
          title: "Área criada",
          description: "A área foi criada. Você já pode configurar suas filas.",
        });
        setIsFormOpen(false);
        navigate(`/operation/areas/${createdArea.id}`);
        return;
      }

      setIsFormOpen(false);
      setEditingArea(null);
    } catch (error) {
      toast({
        title: "Não foi possível salvar a área",
        description: getApiErrorMessage(
          error,
          "Verifique os dados e tente novamente.",
        ),
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async () => {
    if (!areaToDeactivate) return;

    try {
      await mutations.remove.mutateAsync({
        areaId: areaToDeactivate.id,
        expectedVersion: areaToDeactivate.version,
      });
      toast({
        title: "Área desativada",
        description: "A área foi retirada da estrutura ativa.",
      });
      setAreaToDeactivate(null);
      if (areasQuery.data?.items.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      }
    } catch (error) {
      toast({
        title: "Não foi possível desativar a área",
        description: getApiErrorMessage(
          error,
          "A área pode ter sido alterada por outra pessoa.",
        ),
        variant: "destructive",
      });
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1100px] space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/operation"
          className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Operação
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">Estrutura</span>
      </div>

      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Configuração operacional
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Estrutura de atendimento
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Cada área reúne suas filas e a equipe responsável pelo atendimento.
          </p>
        </div>
        {canManage ? (
          <Button size="lg" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nova área
          </Button>
        ) : null}
      </header>

      {currentWorkspace?.type !== "OPERATION" ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Workspace operacional não selecionado</AlertTitle>
          <AlertDescription>
            Selecione um workspace operacional para visualizar sua estrutura.
          </AlertDescription>
        </Alert>
      ) : areasQuery.isLoading ? (
        <Card>
          <CardContent className="flex min-h-48 items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Carregando áreas...
            </span>
          </CardContent>
        </Card>
      ) : areasQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar a estrutura</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            Tente novamente quando a API estiver disponível.
            <Button
              size="sm"
              variant="outline"
              onClick={() => areasQuery.refetch()}
              disabled={areasQuery.isFetching}
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : areasQuery.data?.items.length ? (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-5 w-5 text-primary" />
                Áreas ativas
              </CardTitle>
              <CardDescription>
                {areasQuery.data.total} {areasQuery.data.total === 1 ? "área ativa" : "áreas ativas"}
              </CardDescription>
            </div>
            <Badge variant="outline">Página {areasQuery.data.page}</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <OperationalAreaList
              areas={areasQuery.data.items}
              canManage={canManage}
              onEdit={openEdit}
              onDeactivate={setAreaToDeactivate}
            />
            <SmartPagination
              currentPage={areasQuery.data.page - 1}
              totalPages={areasQuery.data.totalPages}
              onPageChange={(nextPage) => setPage(nextPage + 1)}
              showItemCount
              itemsPerPage={areasQuery.data.limit}
              totalItems={areasQuery.data.total}
              itemLabel="áreas"
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex min-h-56 flex-col items-center justify-center p-6 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <h2 className="mt-4 font-medium">Nenhuma área ativa</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Crie a primeira área para começar a organizar filas e equipe.
            </p>
            {canManage ? (
              <Button className="mt-5" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Criar primeira área
              </Button>
            ) : (
              <Link
                to="/operation"
                className={cn(buttonVariants({ variant: "outline" }), "mt-5")}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para operação
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      <OperationalAreaFormDialog
        open={isFormOpen}
        area={editingArea}
        isPending={mutations.create.isPending || mutations.update.isPending}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingArea(null);
        }}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(areaToDeactivate)}
        onOpenChange={(open) => {
          if (!open && !mutations.remove.isPending) setAreaToDeactivate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar área?</AlertDialogTitle>
            <AlertDialogDescription>
              A área “{areaToDeactivate?.name}” ficará fora da estrutura ativa.
              O histórico será preservado. Filas ativas precisam ser desativadas
              antes.
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
    AREA_HAS_ACTIVE_QUEUES:
      "Desative as filas ativas antes de desativar esta área.",
    AREA_NAME_CONFLICT: "Já existe uma área ativa com esse nome.",
    STALE_VERSION:
      "A área foi alterada por outra pessoa. Atualize a página e tente novamente.",
  };

  return typeof code === "string" && messages[code] ? messages[code] : fallback;
}
