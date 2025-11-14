import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Conversation } from "@/types/conversation";
import { DealPrimaryCard } from "./DealPrimaryCard";
import { DealHistoryList } from "./DealHistoryList";
import { ChangePipelineDialog } from "./ChangePipelineDialog";
import {
  getCustomerDeals,
  CustomerDealApiResponse,
} from "@/services/deal/getCustomerDeals";
import { setPrimaryDeal } from "@/services/deal/setPrimaryDeal";
import { archiveDeal } from "@/services/deal/archiveDeal";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { useToast } from "@/hooks/use-toast";

type DealsPanelProps = {
  conversation: Conversation;
};

export const DealsPanel: React.FC<DealsPanelProps> = ({ conversation }) => {
  const { currentWorkspace } = useWorkspaceManager();
  const { toast } = useToast();

  const [deals, setDeals] = useState<CustomerDealApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChangingPipeline, setIsChangingPipeline] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const loadDeals = useCallback(async () => {
    if (!currentWorkspace?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getCustomerDeals({
        customerId: conversation.customer.id,
        workspaceId: currentWorkspace.id,
        limit: 50,
      });

      setDeals(response.items);
    } catch (err) {
      console.error("Error loading deals:", err);
      setError("Erro ao carregar deals. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [conversation.customer.id, currentWorkspace?.id]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const handleChangePipeline = useCallback(
    async (pipelineId: string) => {
      if (!currentWorkspace?.id) return;

      try {
        await setPrimaryDeal({
          customerId: conversation.customer.id,
          pipelineId,
          workspaceId: currentWorkspace.id,
        });

        toast({
          title: "Funil alterado com sucesso",
          description: "O negócio principal foi atualizado.",
        });

        await loadDeals();
      } catch (err) {
        console.error("Error changing pipeline:", err);
        throw err;
      }
    },
    [conversation.customer.id, currentWorkspace?.id, loadDeals, toast]
  );

  const handleArchiveDeal = useCallback(
    async (dealId: string) => {
      if (!currentWorkspace?.id) return;

      setIsArchiving(true);

      try {
        await archiveDeal({
          dealId,
          workspaceId: currentWorkspace.id,
        });

        toast({
          title: "Negócio arquivado",
          description: "O negócio foi arquivado com sucesso.",
        });

        await loadDeals();
      } catch (err) {
        console.error("Error archiving deal:", err);
        toast({
          title: "Erro ao arquivar negócio",
          description: "Não foi possível arquivar o negócio. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsArchiving(false);
      }
    },
    [currentWorkspace?.id, loadDeals, toast]
  );

  // Memoize separated deals to avoid recalculating on every render
  const { primaryDeal, otherDeals } = useMemo(() => {
    const primary = deals.find((deal) => deal.isPrimaryDeal);
    const others = deals.filter((deal) => !deal.isPrimaryDeal);
    return { primaryDeal: primary, otherDeals: others };
  }, [deals]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          {primaryDeal ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                    Funil Atual
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChangingPipeline(true)}
                    className="h-7 text-xs"
                  >
                    Mudar Funil
                  </Button>
                </div>
                <DealPrimaryCard 
                  deal={primaryDeal} 
                  workspaceId={currentWorkspace?.id}
                  customerId={conversation.customer?.id}
                />
              </div>

              {otherDeals.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                      Histórico de Negócios
                    </h3>
                    <DealHistoryList
                      deals={otherDeals}
                      onArchive={handleArchiveDeal}
                      isArchiving={isArchiving}
                      workspaceId={currentWorkspace?.id}
                      customerId={conversation.customer?.id}
                    />
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-muted-foreground">
                Cliente ainda não está em nenhum funil.
              </p>
              <p className="text-xs text-muted-foreground">
                Selecione um funil para iniciar o atendimento
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsChangingPipeline(true)}
              >
                Selecionar Funil
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      <ChangePipelineDialog
        open={isChangingPipeline}
        onOpenChange={setIsChangingPipeline}
        currentPipelineId={primaryDeal?.pipeline?.id || null}
        onConfirm={handleChangePipeline}
      />
    </>
  );
};
