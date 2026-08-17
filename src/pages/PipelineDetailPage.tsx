import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { listPipelineStages } from "@/services/pipeline/listPipelineStages";
import { moveDealStage } from "@/services/deal/moveDealStage";
import {
  DealListItem,
  GetDealsByStageResponse,
  LeadAttributionSource,
} from "@/types/deal";
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
import { useAuth } from "@/contexts/auth/hooks";
import { MessageSentEvent } from "@/types/websocket";
import { Inbox } from "lucide-react";
import { getDealAttributionOptions } from "@/services/deal/getDealAttributionOptions";
import { MetaAttributionFilters } from "@/components/deals/MetaAttributionFilters";
import { useTranslation } from "react-i18next";

const PipelineDetailPage = () => {
  const { pipelineId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { has } = usePermissions();
  const { userProfile } = useAuth();
  const { t } = useTranslation();

  const { workspaceId, isChangingWorkspace } = useWorkspaceManager({
    queryKeys: ["listPipelineStages", "listPipelines"],
    autoRefetch: true,
    trackLoadingState: true,
  });

  const isSalesRep = userProfile?.role === "SALES_REP";

  const [openCreateDeal, setOpenCreateDeal] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(
    undefined,
  );
  const [attributionSource, setAttributionSource] = useState<
    LeadAttributionSource | "UNATTRIBUTED" | undefined
  >(undefined);
  const [campaignId, setCampaignId] = useState<string | undefined>(undefined);
  const [adId, setAdId] = useState<string | undefined>(undefined);
  const [formId, setFormId] = useState<string | undefined>(undefined);
  const [activitiesSidebarOpen, setActivitiesSidebarOpen] = useState(false);

  // SALES_REP sempre filtra pelos próprios cards
  const effectiveAssignedUserId = isSalesRep
    ? (userProfile?.id ?? undefined)
    : selectedUserId;

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

  useEffect(() => {
    if (!socket || !workspaceId) return;

    const refreshDeals = () => {
      void queryClient.invalidateQueries({
        queryKey: ["dealsByStage"],
      });
    };
    const onMessageSent = (event: MessageSentEvent) => {
      if (event.workspaceId === workspaceId) refreshDeals();
    };

    socket.on("message:sent", onMessageSent);
    socket.on("chat:marked-as-read", refreshDeals);

    return () => {
      socket.off("message:sent", onMessageSent);
      socket.off("chat:marked-as-read", refreshDeals);
    };
  }, [queryClient, socket, workspaceId]);

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

  const attributionOptionsQuery = useQuery({
    queryKey: ["dealAttributionOptions", workspaceId, pipelineId],
    queryFn: () =>
      getDealAttributionOptions({
        workspaceId: workspaceId!,
        pipelineId: pipelineId || undefined,
      }),
    enabled: !!workspaceId && !!pipelineId,
  });

  const attributionOptions = attributionOptionsQuery.data;
  const hasMetaAttributionData = Boolean(
    attributionOptions &&
      (attributionOptions.sources.some((source) => source !== "UNKNOWN") ||
        attributionOptions.campaigns.length > 0 ||
        attributionOptions.ads.length > 0 ||
        (attributionOptions.forms?.length ?? 0) > 0),
  );
  const showAttributionFilters =
    attributionOptionsQuery.isSuccess &&
    Boolean(attributionOptions) &&
    (attributionOptions?.metaAttributionActive === true ||
      hasMetaAttributionData);

  useEffect(() => {
    setAttributionSource(undefined);
    setCampaignId(undefined);
    setAdId(undefined);
    setFormId(undefined);
  }, [workspaceId, pipelineId]);

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

      toast({ title: t("common.success"), description: t("deals.moveSuccess") });
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
            title: t("deals.requiredTitle"),
            description: t("deals.requiredDescription", { fields }),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("deals.validationError"),
            description: errorMessage,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t("common.error"),
          description: t("deals.moveError"),
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
          {t("deals.selectPipeline")}
        </div>
      );
    }

    return (
      <div className="border rounded-lg py-12 text-center">
        <div className="space-y-4">
          {isSalesRep ? (
            <p className="text-muted-foreground">
              {t("deals.noAssignedDeals")}
            </p>
          ) : (
            <>
              <p className="text-muted-foreground">
                {t("deals.noPipeline")}
              </p>
              <Button onClick={() => navigate("/deals/pipeline/create")}>
                {t("deals.createPipeline")}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderEmptyStagesState = () => (
    <div className="border rounded-lg py-12 text-center text-muted-foreground">
      {t("deals.noStages")}
    </div>
  );

  const renderKanbanBoard = () => (
    <KanbanBoard
      stages={stages}
      onMoveDeal={onMoveDeal}
      isMoving={isMoving}
      workspaceId={workspaceId}
      pipelineId={pipelineId}
      assignedUserId={effectiveAssignedUserId}
      attributionSource={attributionSource}
      campaignId={campaignId}
      adId={adId}
      formId={formId}
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
      <div className="space-y-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{t("deals.title")}</h1>
            {canCreateDeal && pipelineId && stages.length > 0 && (
              <Button onClick={() => setOpenCreateDeal(true)} className="mr-2">
                {t("deals.new")}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            {pipelineId && canViewPipeline && (
              <Button
                variant="outline"
                onClick={() => navigate(`/deals/pipeline/${pipelineId}/queue`)}
              >
                <Inbox className="h-4 w-4 mr-2" />
                {t("deals.messageQueue")}
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
        {(showAttributionFilters ||
          (workspaceId && canListUsers && !isSalesRep)) && (
          <div className="flex min-h-10 flex-wrap items-center gap-x-3 gap-y-2">
            {workspaceId && canListUsers && !isSalesRep && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {t("deals.responsible")}
                </span>
                <UserFilter
                  workspaceId={workspaceId}
                  selectedUserId={selectedUserId}
                  onSelectUser={setSelectedUserId}
                />
              </div>
            )}

            {showAttributionFilters && attributionOptions && (
              <>
                {workspaceId && canListUsers && !isSalesRep && (
                  <div className="hidden h-6 w-px bg-border sm:block" />
                )}
                <MetaAttributionFilters
                  options={attributionOptions}
                  hasData={hasMetaAttributionData}
                  attributionSource={attributionSource}
                  campaignId={campaignId}
                  adId={adId}
                  formId={formId}
                  onAttributionSourceChange={setAttributionSource}
                  onCampaignChange={setCampaignId}
                  onAdChange={setAdId}
                  onFormChange={setFormId}
                />
              </>
            )}
          </div>
        )}
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
