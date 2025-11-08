import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { listPipelineStages } from "@/services/pipeline/listPipelineStages";
import { moveDealStage } from "@/services/deal/moveDealStage";
import { DealListItem, GetDealsByStageResponse } from "@/types/deal";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import { CreateDealModal } from "@/components/deals/CreateDealModal";
import { UserFilter } from "@/components/deals/UserFilter";
import { useToast } from "@/components/ui/use-toast";
import PipelineSwitcher from "@/components/pipelines/PipelineSwitcher";
import PipelineEditor from "@/components/pipelines/PipelineEditor";
import { PipelineWhatsAppConnection } from "@/components/pipelines/PipelineWhatsAppConnection";
import { listPipelines } from "@/services/pipeline/listPipelines";
import {
  updatePipeline,
  UpdatePipelineStageItem,
} from "@/services/pipeline/updatePipeline";
import { createPipeline } from "@/services/pipeline/createPipeline";
import { listAgent } from "@/services/agent/listAgent";
import {
  PipelineStageMinimal,
  CreatePipelineInput,
  AssistantPipelineStage,
  WhatsAppIntegrationConfig,
} from "@/types/pipeline";
import { listCompanyWhatsAppIntegrations } from "@/services/whatsapp/listCompanyWhatsAppIntegrations";
import { AxiosError } from "axios";

const PipelineDetailPage = () => {
  const { pipelineId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { workspaceId, isChangingWorkspace } = useWorkspaceManager({
    queryKeys: [
      "listPipelineStages",
      "listPipelines",
      "listAgent",
      "listCompanyWhatsAppIntegrations",
    ],
    autoRefetch: true,
    trackLoadingState: true,
  });

  const [openCreateDeal, setOpenCreateDeal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(
    undefined
  );

  // Helper functions for conditional logic
  const isDataReady = () => {
    return !!pipelineId && !!workspaceId;
  };

  const shouldShowLoading = () => {
    return isCreating
      ? false
      : isChangingWorkspace ||
          stagesQuery.isLoading ||
          pipelinesQuery.isLoading ||
          agentsQuery.isLoading ||
          whatsappIntegrationsQuery.isLoading;
  };

  const shouldAutoSelectPipeline = () => {
    return !workspaceId || pipelineId || isCreating;
  };

  const canShowActions = () => {
    return !isEditing && !isCreating;
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

  const agentsQuery = useQuery({
    queryKey: ["listAgent", workspaceId],
    queryFn: () => listAgent(workspaceId!),
    enabled: !!workspaceId,
  });

  const whatsappIntegrationsQuery = useQuery({
    queryKey: ["listCompanyWhatsAppIntegrations", workspaceId],
    queryFn: () => listCompanyWhatsAppIntegrations(workspaceId!),
    enabled: !!workspaceId,
  });

  useEffect(() => {
    if (!workspaceId || pipelineId || isCreating) return;

    const list = pipelinesQuery.data;
    if (!list || list.length === 0) return;

    try {
      const key = `acc:selectedPipeline:${workspaceId}`;
      const saved = localStorage.getItem(key);
      const exists = saved && list.some((p) => p.id === saved);
      const targetId = exists ? saved! : list[0].id;

      // Clean stale value if it doesn't exist in the list
      if (saved && !exists) {
        localStorage.removeItem(key);
      }

      // Navigate to the target pipeline (either saved or first one)
      navigate(`/deals/pipeline/${targetId}`, { replace: true });
    } catch {
      navigate("/");
    }
  }, [workspaceId, pipelineId, pipelinesQuery.data, navigate, isCreating]);

  // Persist currently selected pipeline per workspace
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
  const agents = agentsQuery.data?.agents || [];
  const whatsappIntegrations = whatsappIntegrationsQuery.data || [];

  const currentPipeline = useMemo(() => {
    return pipelinesQuery.data?.find((p) => p.id === pipelineId);
  }, [pipelinesQuery.data, pipelineId]);

  const currentPipelineName = currentPipeline?.name || "";
  const currentPipelineAssistantId = currentPipeline?.assistantId || undefined;
  const currentPipelineWhatsappIntegrationId =
    currentPipeline?.companyWhatsappIntegrationId || undefined;

  const hasPipelines = (pipelinesQuery.data?.length ?? 0) > 0;
  const loading = shouldShowLoading();

  const onMoveDeal = async (dealId: string, toStageId: string) => {
    if (!pipelineId || !workspaceId) return;

    setIsMoving(true);

    // Find the deal and its current stage
    let fromStageId: string | null = null;
    let movedDeal: DealListItem | null = null;

    // Store previous data for rollback
    const previousData: Record<string, unknown> = {};

    // Optimistic update: Move deal immediately in the UI
    stages.forEach((stage) => {
      const queryKey = ["dealsByStage", stage.id, workspaceId];
      const currentData = queryClient.getQueryData<{
        pages: GetDealsByStageResponse[];
      }>(queryKey);

      if (currentData) {
        previousData[stage.id] = currentData;

        // Check if this stage has the deal
        const pages = currentData.pages || [];
        for (const page of pages) {
          const deal = page.deals?.find((d: DealListItem) => d.id === dealId);
          if (deal) {
            fromStageId = stage.id;
            movedDeal = { ...deal, stageId: toStageId };
            break;
          }
        }
      }
    });

    if (movedDeal && fromStageId) {
      // Remove from old stage
      const fromQueryKey = ["dealsByStage", fromStageId, workspaceId];
      queryClient.setQueryData<{ pages: GetDealsByStageResponse[] }>(
        fromQueryKey,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              deals: page.deals.filter((d: DealListItem) => d.id !== dealId),
              total: page.total - 1,
            })),
          };
        }
      );

      // Add to new stage
      const toQueryKey = ["dealsByStage", toStageId, workspaceId];
      queryClient.setQueryData<{ pages: GetDealsByStageResponse[] }>(
        toQueryKey,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page, index: number) => {
              // Add to first page
              if (index === 0) {
                return {
                  ...page,
                  deals: [movedDeal!, ...page.deals],
                  total: page.total + 1,
                };
              }
              return page;
            }),
          };
        }
      );
    }

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
      // Rollback optimistic update on error
      Object.entries(previousData).forEach(([stageId, data]) => {
        queryClient.setQueryData(["dealsByStage", stageId, workspaceId], data);
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
          /Required fields must be filled: (.+)/
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

  const handleSavePipeline = async ({
    name,
    stages: draft,
    assistantId,
    whatsappIntegration,
  }: {
    name: string;
    stages: Array<{
      id: string;
      name: string;
      order: number;
      color?: string;
      winProbability?: number;
      assistantPipelineStage?: AssistantPipelineStage;
    }>;
    assistantId?: string;
    whatsappIntegration?: WhatsAppIntegrationConfig | null;
  }) => {
    if (!pipelineId || !workspaceId) return;
    try {
      await updatePipeline(pipelineId, {
        workspaceId,
        name,
        assistantId: assistantId || null,
        stages: draft.map((s): UpdatePipelineStageItem => {
          const stage: UpdatePipelineStageItem = {
            name: s.name,
            order: s.order,
            color: s.color,
            winProbability: s.winProbability,
            assistantPipelineStage: s.assistantPipelineStage || null,
          };
          // Only include id if it's not a temporary id (new stage)
          if (!s.id.startsWith("tmp-")) {
            stage.id = s.id;
          }
          return stage;
        }),
        whatsappIntegration,
      });
      setIsEditing(false);
      // refresh data
      queryClient.invalidateQueries({
        queryKey: ["listPipelineStages", pipelineId, workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["listPipelines", workspaceId],
      });
      toast({ title: "Sucesso", description: "Funil atualizado com sucesso." });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to update pipeline.",
        variant: "destructive",
      });
    }
  };

  const getDefaultCreateStages = (): PipelineStageMinimal[] => {
    const base: Array<{ name: string; color: string; winProbability: number }> =
      [
        { name: "Qualificado", color: "#4f46e5", winProbability: 100 },
        { name: "Contato Realizado", color: "#0ea5e9", winProbability: 100 },
        {
          name: "Demonstração Agendada",
          color: "#10b981",
          winProbability: 100,
        },
        { name: "Proposta Feita", color: "#f59e0b", winProbability: 100 },
        {
          name: "Negociações Iniciadas",
          color: "#ef4444",
          winProbability: 100,
        },
      ];
    return base.map((s, i) => ({
      id: `tmp-${i + 1}`,
      name: s.name,
      color: s.color,
      winProbability: s.winProbability,
    }));
  };

  const handleCreatePipeline = async ({
    name,
    stages: draft,
    assistantId,
    whatsappIntegration,
  }: {
    name: string;
    stages: Array<{
      id: string;
      name: string;
      order: number;
      color?: string;
      winProbability?: number;
      assistantPipelineStage?: AssistantPipelineStage;
    }>;
    assistantId?: string;
    whatsappIntegration?: WhatsAppIntegrationConfig | null;
  }) => {
    if (!workspaceId) return;
    try {
      const payload: CreatePipelineInput = {
        workspaceId,
        name: name || "Novo funil",
        assistantId: assistantId || null,
        stages: draft.map((s, i) => ({
          name: s.name || `Etapa ${i + 1}`,
          description: "",
          order: i,
          color: s.color || "#64748b",
          winProbability:
            typeof s.winProbability === "number" ? s.winProbability : 100,
          assistantPipelineStage: s.assistantPipelineStage || null,
        })),
        whatsappIntegration,
      };
      const res = await createPipeline(payload);
      setIsCreating(false);
      // refresh lists and go to new pipeline
      queryClient.invalidateQueries({
        queryKey: ["listPipelines", workspaceId],
      });
      navigate(`/deals/pipeline/${res.id}`);
      toast({ title: "Sucesso", description: "Funil criado com sucesso." });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to create pipeline.",
        variant: "destructive",
      });
    }
  };

  // Render functions for different states
  const renderLoadingState = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ))}
    </div>
  );

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
          <Button onClick={() => setIsCreating(true)}>Criar funil</Button>
        </div>
      </div>
    );
  };

  const renderEditingState = () => (
    <PipelineEditor
      pipelineName={currentPipelineName}
      stages={stages}
      availableAgents={agents}
      selectedAssistantId={currentPipelineAssistantId}
      availableWhatsAppIntegrations={whatsappIntegrations}
      companyWhatsappIntegrationId={currentPipelineWhatsappIntegrationId}
      onCancel={() => setIsEditing(false)}
      onSave={handleSavePipeline}
    />
  );

  const renderCreatingState = () => (
    <PipelineEditor
      pipelineName={"Novo funil"}
      stages={getDefaultCreateStages()}
      availableAgents={agents}
      selectedAssistantId={undefined}
      availableWhatsAppIntegrations={whatsappIntegrations}
      onCancel={() => setIsCreating(false)}
      onSave={handleCreatePipeline}
      saveLabel="Criar funil"
    />
  );

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
    if (isEditing) return renderEditingState();
    if (isCreating) return renderCreatingState();
    if (!pipelineId) return renderNoPipelineState();
    if (stages.length === 0) return renderEmptyStagesState();
    return renderKanbanBoard();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Negócios</h1>
          {canShowActions() && (
            <Button onClick={() => setOpenCreateDeal(true)} className="mr-2">
              Novo Negócio
            </Button>
          )}
          {/* User filter next to title */}
          {workspaceId && !isEditing && !isCreating && stages.length > 0 && (
            <UserFilter
              workspaceId={workspaceId}
              selectedUserId={selectedUserId}
              onSelectUser={setSelectedUserId}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentPipelineWhatsappIntegrationId &&
            canShowActions() &&
            workspaceId && (
              <PipelineWhatsAppConnection
                companyWhatsappIntegrationId={
                  currentPipelineWhatsappIntegrationId
                }
                workspaceId={workspaceId}
              />
            )}
          {workspaceId && canShowActions() && (
            <PipelineSwitcher
              workspaceId={workspaceId}
              currentPipelineId={pipelineId}
              onSelect={handleSelectPipeline}
              onEditCurrent={() => setIsEditing(true)}
              onCreateNew={() => setIsCreating(true)}
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
    </div>
  );
};

export default PipelineDetailPage;
