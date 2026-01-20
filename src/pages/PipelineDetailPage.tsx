import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { listPipelineStages } from "@/services/pipeline/listPipelineStages";
import { moveDealStage } from "@/services/deal/moveDealStage";
import { DealListItem, GetDealsByStageResponse } from "@/types/deal";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import { KanbanSkeleton } from "@/components/kanban/KanbanSkeleton";
import { CreateDealModal } from "@/components/deals/CreateDealModal";
import { UserFilter } from "@/components/deals/UserFilter";
import { useToast } from "@/components/ui/use-toast";
import PipelineSwitcher from "@/components/pipelines/PipelineSwitcher";
import { PipelineWhatsAppConnection } from "@/components/pipelines/PipelineWhatsAppConnection";
import { listPipelines } from "@/services/pipeline/listPipelines";
import { AxiosError } from "axios";
import { ActivitiesSidebar } from "@/components/deals/ActivitiesSidebar";
import { ActivitiesButton } from "@/components/deals/ActivitiesButton";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useDealStageWebSocket } from "@/hooks/useDealStageWebSocket";
import { useActivityWebSocket } from "@/hooks/useActivityWebSocket";
import { usePermissions } from "@/hooks/usePermissions";
import { Inbox } from "lucide-react";

const PipelineDetailPage = () => {
  const { pipelineId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { has } = usePermissions();

  const { workspaceId, isChangingWorkspace } = useWorkspaceManager({
    queryKeys: ["listPipelineStages", "listPipelines"],
    autoRefetch: true,
    trackLoadingState: true,
  });

  const [openCreateDeal, setOpenCreateDeal] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(
    undefined,
  );
  const [activitiesSidebarOpen, setActivitiesSidebarOpen] = useState(false);

  // WebSocket connection
  const token = localStorage.getItem("token") || "";
  const { socket } = useWebSocket({
    workspaceId: workspaceId || "",
    token,
    enabled: !!workspaceId && !!token,
  });

  // WebSocket event handlers
  useDealStageWebSocket({
    socket,
    workspaceId: workspaceId || "",
    pipelineId: pipelineId || "",
    enabled: !!socket && !!workspaceId && !!pipelineId,
  });

  useActivityWebSocket({
    socket,
    workspaceId: workspaceId || "",
    enabled: !!socket && !!workspaceId,
  });

  const isDataReady = () => {
    return !!pipelineId && !!workspaceId;
  };

  const shouldShowLoading = () => {
    return (
      isChangingWorkspace || stagesQuery.isLoading || pipelinesQuery.isLoading
    );
  };

  const stagesQuery = useQuery({
    queryKey: ["listPipelineStages", pipelineId, workspaceId],
    queryFn: () => listPipelineStages(pipelineId!, workspaceId!),
    enabled: isDataReady(),
  });

  const pipelinesQuery = useQuery({
    queryKey: ["listPipelines", workspaceId],
    queryFn: () => listPipelines(workspaceId!),
    enabled: !!workspaceId,
  });

  useEffect(() => {
    if (!workspaceId || pipelineId) return;

    const list = pipelinesQuery.data;
    if (!list || list.length === 0) return;

    try {
      const key = `acc:selectedPipeline:${workspaceId}`;
      const saved = localStorage.getItem(key);
      const exists = saved && list.some((p) => p.id === saved);
      const targetId = exists ? saved! : list[0].id;

      if (saved && !exists) {
        localStorage.removeItem(key);
      }

      navigate(`/deals/pipeline/${targetId}`, { replace: true });
    } catch {
      navigate("/");
    }
  }, [workspaceId, pipelineId, pipelinesQuery.data, navigate]);

  useEffect(() => {
    if (!workspaceId || !pipelineId) return;
    try {
      const key = `acc:selectedPipeline:${workspaceId}`;
      localStorage.setItem(key, pipelineId);
    } catch {
      // ignore storage errors
    }
  }, [workspaceId, pipelineId]);

  const stages = stagesQuery.data || [];

  const currentPipeline = useMemo(() => {
    return pipelinesQuery.data?.find((p) => p.id === pipelineId);
  }, [pipelinesQuery.data, pipelineId]);

  const currentPipelineWhatsappIntegrationId =
    currentPipeline?.companyWhatsappIntegrationId || undefined;

  const hasPipelines = (pipelinesQuery.data?.length ?? 0) > 0;
  const loading = shouldShowLoading();

  const onMoveDeal = async (dealId: string, toStageId: string) => {
    if (!pipelineId || !workspaceId) return;

    // Find the deal and its current stage
    let fromStageId: string | null = null;
    let movedDeal: DealListItem | null = null;

    // Store previous data for rollback - get all queries for each stage
    const previousData: Map<string, unknown> = new Map();

    // Find which stage the deal is currently in by checking all query variations
    stages.forEach((stage) => {
      // Get all queries that match the stage pattern
      const queries = queryClient.getQueriesData<{
        pages: GetDealsByStageResponse[];
      }>({
        queryKey: ["dealsByStage", stage.id, workspaceId],
      });

      queries.forEach(([queryKey, currentData]) => {
        if (currentData) {
          // Store for potential rollback
          const key = JSON.stringify(queryKey);
          previousData.set(key, currentData);

          // Check if this stage has the deal
          if (!fromStageId) {
            const pages = currentData.pages || [];
            for (const page of pages) {
              const deal = page.items?.find(
                (d: DealListItem) => d.id === dealId,
              );
              if (deal) {
                fromStageId = stage.id;
                movedDeal = { ...deal, stageId: toStageId };
                break;
              }
            }
          }
        }
      });
    });

    // Se o deal já está na coluna de destino, não faça nada
    if (fromStageId === toStageId) {
      return;
    }

    if (!fromStageId || !movedDeal) {
      return;
    }

    setIsMoving(true);

    // Optimistic update: Move deal immediately in the UI
    // Remove from old stage - update all query variations
    const fromQueries = queryClient.getQueriesData<{
      pages: GetDealsByStageResponse[];
    }>({
      queryKey: ["dealsByStage", fromStageId, workspaceId],
    });

    fromQueries.forEach(([queryKey]) => {
      queryClient.setQueryData<{ pages: GetDealsByStageResponse[] }>(
        queryKey,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.filter((d: DealListItem) => d.id !== dealId),
              total: page.total - 1,
            })),
          };
        },
      );
    });

    // Add to new stage - update all query variations
    const toQueries = queryClient.getQueriesData<{
      pages: GetDealsByStageResponse[];
    }>({
      queryKey: ["dealsByStage", toStageId, workspaceId],
    });

    toQueries.forEach(([queryKey]) => {
      queryClient.setQueryData<{ pages: GetDealsByStageResponse[] }>(
        queryKey,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page, index: number) => {
              // Add to first page
              if (index === 0) {
                return {
                  ...page,
                  items: [movedDeal!, ...page.items],
                  total: page.total + 1,
                };
              }
              return page;
            }),
          };
        },
      );
    });

    try {
      await moveDealStage(dealId, { workspaceId, stageId: toStageId });

      // Revalidate to ensure data consistency
      stages.forEach((stage) => {
        queryClient.invalidateQueries({
          queryKey: ["dealsByStage", stage.id, workspaceId],
        });
      });

      toast({ title: "Sucesso", description: "Negócio movido com sucesso." });
    } catch (e: unknown) {
      // Rollback optimistic update on error - restore all queries
      previousData.forEach((data, key) => {
        const queryKey = JSON.parse(key);
        queryClient.setQueryData(queryKey, data);
      });

      // Handle validation error for required fields
      if (
        e &&
        e instanceof AxiosError &&
        e?.response?.status === 422 &&
        e?.response?.data?.message
      ) {
        const errorMessage = e.response.data.message;

        // Extract field names from error message
        const match = errorMessage.match(
          /Required fields must be filled: (.+)/,
        );
        if (match) {
          const fields = match[1];
          toast({
            title: "Campos obrigatórios não preenchidos",
            description: `Preencha os seguintes campos antes de mover o negócio: ${fields}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro de validação",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Erro",
          description: "Falha ao mover negócio.",
          variant: "destructive",
        });
      }
    } finally {
      setIsMoving(false);
    }
  };

  const handleSelectPipeline = (id: string) => {
    if (!id || id === pipelineId) return;
    try {
      if (workspaceId) {
        const key = `acc:selectedPipeline:${workspaceId}`;
        localStorage.setItem(key, id);
      }
    } catch {
      // ignore storage errors
    }
    navigate(`/deals/pipeline/${id}`);
  };

  // Verifica se o usuário tem permissão para editar pipelines
  const canUpdatePipeline = has("update:pipeline");
  const canCreatePipeline = has("create:pipeline");
  const canListUsers = has("list:users");
  const canCreateDeal = has("create:deal");
  const canViewPipeline = has("view:pipeline");

  const renderLoadingState = () => <KanbanSkeleton columns={4} />;

  const renderNoPipelineState = () => {
    if (hasPipelines) {
      return (
        <div className="border rounded-lg py-12 text-center text-muted-foreground">
          Selecione um funil no topo ou crie um novo.
        </div>
      );
    }

    return (
      <div className="border rounded-lg py-12 text-center">
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Você ainda não tem nenhum funil.
          </p>
          <Button onClick={() => navigate("/deals/pipeline/create")}>
            Criar funil
          </Button>
        </div>
      </div>
    );
  };

  const renderEmptyStagesState = () => (
    <div className="border rounded-lg py-12 text-center text-muted-foreground">
      Este pipeline não possui etapas. Crie etapas para visualizar o Kanban.
    </div>
  );

  const renderKanbanBoard = () => (
    <KanbanBoard
      stages={stages}
      onMoveDeal={onMoveDeal}
      isMoving={isMoving}
      workspaceId={workspaceId}
      pipelineId={pipelineId}
      assignedUserId={selectedUserId}
      onDealUpdated={() => {
        stages.forEach((stage) => {
          queryClient.invalidateQueries({
            queryKey: ["dealsByStage", stage.id, workspaceId],
          });
        });
      }}
    />
  );

  const renderMainContent = () => {
    if (loading) return renderLoadingState();
    if (!pipelineId) return renderNoPipelineState();
    if (stages.length === 0) return renderEmptyStagesState();
    return renderKanbanBoard();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Negócios</h1>
          {canCreateDeal && pipelineId && stages.length > 0 && (
            <Button onClick={() => setOpenCreateDeal(true)} className="mr-2">
              Novo Negócio
            </Button>
          )}
          {workspaceId && canListUsers && (
            <UserFilter
              workspaceId={workspaceId}
              selectedUserId={selectedUserId}
              onSelectUser={setSelectedUserId}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {pipelineId && canViewPipeline && (
            <Button
              variant="outline"
              onClick={() => navigate(`/deals/pipeline/${pipelineId}/queue`)}
            >
              <Inbox className="h-4 w-4 mr-2" />
              Fila de Mensagens
            </Button>
          )}
          {currentPipelineWhatsappIntegrationId && workspaceId && (
            <PipelineWhatsAppConnection
              companyWhatsappIntegrationId={
                currentPipelineWhatsappIntegrationId
              }
              workspaceId={workspaceId}
            />
          )}
          {workspaceId && (
            <PipelineSwitcher
              workspaceId={workspaceId}
              currentPipelineId={pipelineId}
              onSelect={handleSelectPipeline}
              onEditCurrent={() =>
                navigate(`/deals/pipeline/${pipelineId}/edit`)
              }
              onCreateNew={() => navigate("/deals/pipeline/create")}
              canEdit={canUpdatePipeline}
              canCreate={canCreatePipeline}
            />
          )}
          {workspaceId && (
            <ActivitiesButton
              workspaceId={workspaceId}
              onClick={() => setActivitiesSidebarOpen(!activitiesSidebarOpen)}
              isOpen={activitiesSidebarOpen}
              socket={socket}
            />
          )}
        </div>
      </div>

      {renderMainContent()}

      {isDataReady() && (
        <CreateDealModal
          open={openCreateDeal}
          onOpenChange={setOpenCreateDeal}
          workspaceId={workspaceId!}
          pipelineId={pipelineId!}
          stages={stages}
          onCreated={() => {
            stages.forEach((stage) => {
              queryClient.invalidateQueries({
                queryKey: ["dealsByStage", stage.id, workspaceId],
              });
            });
          }}
        />
      )}

      {workspaceId && (
        <ActivitiesSidebar
          workspaceId={workspaceId}
          isOpen={activitiesSidebarOpen}
          onClose={() => setActivitiesSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default PipelineDetailPage;
