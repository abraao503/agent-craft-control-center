import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { listPipelineStages } from "@/services/pipeline/listPipelineStages";
import { listDealsByPipeline } from "@/services/deal/listDealsByPipeline";
import { moveDealStage } from "@/services/deal/moveDealStage";
import { DealListItem } from "@/types/deal";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import { CreateDealModal } from "@/components/deals/CreateDealModal";
import { useToast } from "@/components/ui/use-toast";
import PipelineSwitcher from "@/components/pipelines/PipelineSwitcher";
import PipelineEditor from "@/components/pipelines/PipelineEditor";
import { listPipelines } from "@/services/pipeline/listPipelines";
import { updatePipeline } from "@/services/pipeline/updatePipeline";
import { createPipeline } from "@/services/pipeline/createPipeline";
import { listAgent } from "@/services/agent/listAgent";
import { PipelineStageMinimal, CreatePipelineInput, AssistantPipelineStage } from "@/types/pipeline";
import { Agent } from "@/types/agent";

const PipelineDetailPage = () => {
  const { pipelineId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { workspaceId, isChangingWorkspace } = useWorkspaceManager({
    queryKeys: ["listPipelineStages", "listDealsByPipeline", "listPipelines", "listAgent"],
    autoRefetch: true,
    trackLoadingState: true,
  });

  const [openCreateDeal, setOpenCreateDeal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  // Helper functions for conditional logic
  const isDataReady = () => {
    return !!pipelineId && !!workspaceId;
  };

  const shouldShowLoading = () => {
    return isCreating
      ? false
      : isChangingWorkspace ||
          stagesQuery.isLoading ||
          dealsQuery.isLoading ||
          pipelinesQuery.isLoading ||
          agentsQuery.isLoading;
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

  const dealsQuery = useQuery({
    queryKey: ["listDealsByPipeline", pipelineId, workspaceId],
    queryFn: () => listDealsByPipeline(pipelineId!, workspaceId!),
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

  useEffect(() => {
    if (!workspaceId || pipelineId || isCreating) return;

    const list = pipelinesQuery.data;
    if (!list || list.length === 0) return;

    try {
      const key = `acc:selectedPipeline:${workspaceId}`;
      const saved = localStorage.getItem(key);
      const exists = saved && list.some((p) => p.id === saved);
      const targetId = exists ? saved! : list[0].id;
      if (exists) {
        navigate(`/deals/pipeline/${targetId}`, { replace: true });
      } else {
        // clean stale value and fallback to first
        if (saved) localStorage.removeItem(key);
        navigate("/");
      }
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
  const deals = dealsQuery.data || [];
  const agents = agentsQuery.data?.agents || [];
  
  const currentPipeline = useMemo(() => {
    return pipelinesQuery.data?.find((p) => p.id === pipelineId);
  }, [pipelinesQuery.data, pipelineId]);
  
  const currentPipelineName = currentPipeline?.name || "";
  const currentPipelineAssistantId = currentPipeline?.assistantId || undefined;

  const hasPipelines = (pipelinesQuery.data?.length ?? 0) > 0;
  const loading = shouldShowLoading();

  const onMoveDeal = async (dealId: string, toStageId: string) => {
    if (!pipelineId || !workspaceId) return;

    setIsMoving(true);
    const key = ["listDealsByPipeline", pipelineId, workspaceId] as const;
    const previous = queryClient.getQueryData<DealListItem[] | undefined>(key);

    // Optimistic update
    queryClient.setQueryData<DealListItem[] | undefined>(key, (old) => {
      if (!old) return old;
      return old.map((d) =>
        d.id === dealId ? { ...d, stageId: toStageId } : d
      );
    });

    try {
      await moveDealStage(dealId, { workspaceId, stageId: toStageId });
      // Revalidate
      queryClient.invalidateQueries({ queryKey: key });
      toast({ title: "Sucesso", description: "Negócio movido com sucesso." });
    } catch (e) {
      // Revert on error
      queryClient.setQueryData(key, previous);
      toast({
        title: "Error",
        description: "Failed to move deal.",
        variant: "destructive",
      });
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
  }) => {
    if (!pipelineId || !workspaceId) return;
    try {
      await updatePipeline(pipelineId, {
        workspaceId,
        name,
        assistantId: assistantId || null,
        stages: draft.map((s) => ({
          id: s.id,
          name: s.name,
          order: s.order,
          color: s.color,
          winProbability: s.winProbability,
          assistantPipelineStage: s.assistantPipelineStage || null,
        })),
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
      deals={deals}
      onMoveDeal={onMoveDeal}
      isMoving={isMoving}
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
            <Button onClick={() => setOpenCreateDeal(true)}>
              Novo Negócio
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
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
          onCreated={() =>
            queryClient.invalidateQueries({
              queryKey: ["listDealsByPipeline", pipelineId, workspaceId],
            })
          }
        />
      )}
    </div>
  );
};

export default PipelineDetailPage;
