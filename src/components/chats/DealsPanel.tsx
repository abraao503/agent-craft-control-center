import React, { useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  ChevronDown,
  Clock3,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Conversation } from "@/types/conversation";
import { DealListItem } from "@/types/deal";
import { DealViewModal } from "@/components/deals/DealViewModal";
import { DealFollowUpListDialog } from "@/components/deals/follow-up/DealFollowUpListDialog";
import { DealHistoryList } from "./DealHistoryList";
import { ChangePipelineDialog } from "./ChangePipelineDialog";
import {
  CustomerDealApiResponse,
  getCustomerDeals,
} from "@/services/deal/getCustomerDeals";
import { setPrimaryDeal } from "@/services/deal/setPrimaryDeal";
import { archiveDeal } from "@/services/deal/archiveDeal";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";

type DealsPanelProps = {
  conversation: Conversation;
  embedded?: boolean;
};

const EMPTY_DEALS: CustomerDealApiResponse[] = [];

const dealsQueryKey = (customerId: string, workspaceId?: string) => [
  "getCustomerDeals",
  customerId,
  workspaceId,
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const toDealListItem = (deal: CustomerDealApiResponse): DealListItem => ({
  id: deal.id,
  stageId: deal.stageId,
  title: deal.title,
  description: deal.description,
  value: deal.value,
  createdAt: deal.createdAt,
  updatedAt: deal.updatedAt,
  assignedUser: deal.assignedUser
    ? {
        id: deal.assignedUser.id,
        name: deal.assignedUser.name,
      }
    : null,
});

export const DealsPanel: React.FC<DealsPanelProps> = ({
  conversation,
  embedded = false,
}) => {
  const { currentWorkspace } = useWorkspaceManager();
  const { has } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isChangingPipeline, setIsChangingPipeline] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<DealListItem | null>(null);
  const [followUpsDeal, setFollowUpsDeal] =
    useState<CustomerDealApiResponse | null>(null);
  const canViewDeal = has("view:deal");
  const canUpdateDeal = has("update:deal");
  const canDeleteDeal = has("delete:deal");

  const queryKey = dealsQueryKey(
    conversation.customer.id,
    currentWorkspace?.id,
  );
  const dealsQuery = useQuery({
    queryKey,
    queryFn: () =>
      getCustomerDeals({
        customerId: conversation.customer.id,
        workspaceId: currentWorkspace!.id,
        limit: 50,
      }),
    enabled: Boolean(
      currentWorkspace?.id && conversation.customer.id && canViewDeal,
    ),
  });

  const deals = dealsQuery.data?.items ?? EMPTY_DEALS;
  const primaryDeal = deals.find((deal) => deal.isPrimaryDeal) ?? null;
  const otherDeals = deals.filter((deal) => !deal.isPrimaryDeal);

  const fallbackDeal = conversation.primaryDeal;
  const pipelineName = primaryDeal?.pipeline.name ?? fallbackDeal?.pipeline.name;
  const stageName = primaryDeal?.currentStage?.name ?? fallbackDeal?.stage.name;
  const stageColor = fallbackDeal?.stage.color;
  const hasDeal = Boolean(primaryDeal || fallbackDeal);

  const changePipelineMutation = useMutation({
    mutationFn: (pipelineId: string) =>
      setPrimaryDeal({
        customerId: conversation.customer.id,
        pipelineId,
        workspaceId: currentWorkspace!.id,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Funil alterado com sucesso",
        description: "O negócio principal foi atualizado.",
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (dealId: string) =>
      archiveDeal({ dealId, workspaceId: currentWorkspace!.id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Negócio arquivado",
        description: "O negócio foi arquivado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao arquivar negócio",
        description: "Não foi possível arquivar o negócio. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleChangePipeline = async (pipelineId: string) => {
    await changePipelineMutation.mutateAsync(pipelineId);
  };

  const handleOpenDeal = (deal: CustomerDealApiResponse) => {
    setSelectedDeal(toDealListItem(deal));
  };

  const content = (
    <div className="space-y-4">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
            <div>
              <h2 className="text-sm font-semibold">Negócio atual</h2>
              <p className="text-xs text-muted-foreground">
                Contexto comercial desta conversa
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setIsChangingPipeline(true)}
            disabled={!currentWorkspace?.id || !canUpdateDeal}
          >
            Mudar funil
          </Button>
        </div>

        <div className="rounded-xl border border-primary/25 bg-primary/[0.03] p-3 shadow-sm">
          {dealsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-6 w-24" />
            </div>
          ) : hasDeal ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {primaryDeal?.title || "Negócio principal"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {pipelineName || "Funil não informado"}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  Principal
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {stageName && (
                  <Badge
                    variant="secondary"
                    className="max-w-full truncate text-xs"
                    style={
                      stageColor
                        ? {
                            backgroundColor: `${stageColor}20`,
                            color: stageColor,
                            borderColor: `${stageColor}50`,
                          }
                        : undefined
                    }
                  >
                    {stageName}
                  </Badge>
                )}
                {primaryDeal?.value !== null &&
                  primaryDeal?.value !== undefined && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                      <DollarSign className="h-3.5 w-3.5" />
                      {formatCurrency(primaryDeal.value)}
                    </span>
                  )}
              </div>

              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>
                  Responsável: {primaryDeal?.assignedUser?.name ?? fallbackDeal?.assignedUser?.name ?? "Não atribuído"}
                </p>
                {primaryDeal?.updatedAt && (
                  <p>
                    Atualizado em {format(new Date(primaryDeal.updatedAt), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 flex-1 text-xs"
                  disabled={!primaryDeal || !canViewDeal}
                  onClick={() => primaryDeal && handleOpenDeal(primaryDeal)}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Ver negócio
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={!primaryDeal || !canViewDeal}
                  onClick={() => primaryDeal && setFollowUpsDeal(primaryDeal)}
                >
                  <Clock3 className="mr-1.5 h-3.5 w-3.5" />
                  Agendamentos
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-2 py-1">
              <p className="text-sm font-medium">Nenhum negócio principal</p>
              <p className="text-xs text-muted-foreground">
                Selecione um funil para iniciar o atendimento comercial.
              </p>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => setIsChangingPipeline(true)}
              >
                Selecionar funil
              </Button>
            </div>
          )}
        </div>

        {dealsQuery.isError && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-2 text-xs">
              Não foi possível carregar os detalhes do negócio.
              <Button
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 px-2 text-xs"
                onClick={() => dealsQuery.refetch()}
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </section>

      {otherDeals.length > 0 && (
        <section>
          <Separator />
          <Button
            variant="ghost"
            className="mt-2 flex h-auto w-full items-center justify-between px-1 py-2 text-left hover:bg-transparent"
            onClick={() => setShowHistory((value) => !value)}
            aria-expanded={showHistory}
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Outros negócios ({otherDeals.length})
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${showHistory ? "rotate-180" : ""}`}
            />
          </Button>
          {showHistory && (
            <div className="pt-2">
              <DealHistoryList
                deals={otherDeals}
                onArchive={(dealId) => archiveMutation.mutate(dealId)}
                isArchiving={archiveMutation.isPending}
                canArchive={canDeleteDeal}
                workspaceId={currentWorkspace?.id}
                customerId={conversation.customer.id}
              />
            </div>
          )}
        </section>
      )}

      {currentWorkspace?.id && selectedDeal && canViewDeal && (
        <DealViewModal
          open={Boolean(selectedDeal)}
          onOpenChange={(open) => !open && setSelectedDeal(null)}
          deal={selectedDeal}
          workspaceId={currentWorkspace.id}
          pipelineId={primaryDeal?.pipeline.id}
        />
      )}

      {currentWorkspace?.id && followUpsDeal && canViewDeal && (
        <DealFollowUpListDialog
          open={Boolean(followUpsDeal)}
          onOpenChange={(open) => !open && setFollowUpsDeal(null)}
          dealId={followUpsDeal.id}
          dealTitle={followUpsDeal.title}
        />
      )}

      <ChangePipelineDialog
        open={isChangingPipeline}
        onOpenChange={setIsChangingPipeline}
        currentPipelineId={primaryDeal?.pipeline.id ?? fallbackDeal?.pipeline.id ?? null}
        onConfirm={handleChangePipeline}
      />
    </div>
  );

  if (embedded) return content;

  return (
    <ScrollArea className="h-full">
      <div className="p-4">{content}</div>
    </ScrollArea>
  );
};
