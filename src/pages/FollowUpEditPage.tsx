import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { listAgent } from "@/services/agent/listAgent";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { FollowUpForm } from "@/components/follow-up/FollowUpForm";
import {
  updateFollowUp,
  getFollowUpById,
  FollowUpUpdateData,
} from "@/services/follow-up";
import { FollowUp } from "@/types/follow-up";

export default function FollowUpEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const workspaceId = currentWorkspace?.id || "";

  const [isLoadingFollowUp, setIsLoadingFollowUp] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(
    null
  );

  // Fetch assistants using React Query
  const { data: agentsData, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["agents", workspaceId],
    queryFn: () => listAgent(workspaceId),
    enabled: !!workspaceId,
  });

  const assistants = agentsData?.agents || [];

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: FollowUpUpdateData & { workspaceId: string };
    }) => updateFollowUp(id, data),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Follow-up atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["followUps", workspaceId] });
      navigate("/follow-ups");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error?.message || "Erro ao atualizar follow-up",
        variant: "destructive",
      });
    },
  });

  // Load follow-up data
  useEffect(() => {
    const loadFollowUp = async () => {
      if (!id || !workspaceId) return;

      setIsLoadingFollowUp(true);
      try {
        const followUpData = await getFollowUpById(id);
        setSelectedFollowUp(followUpData);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do follow-up",
          variant: "destructive",
        });
        navigate("/follow-ups");
      } finally {
        setIsLoadingFollowUp(false);
      }
    };

    loadFollowUp();
  }, [id, workspaceId, toast, navigate]);

  const handleEditSubmit = (
    data: FollowUpUpdateData & { workspaceId: string }
  ) => {
    if (!id) return;
    updateMutation.mutate({ id, data });
  };

  const handleGoBack = () => {
    navigate("/follow-ups");
  };

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Selecione um workspace para editar o follow-up
        </p>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">ID do follow-up não encontrado</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Editar Follow-Up
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {isLoadingFollowUp ? (
          <div className="py-8 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
              <p className="text-muted-foreground">
                Carregando dados do follow-up...
              </p>
            </div>
          </div>
        ) : isLoadingAgents ? (
          <div className="py-8 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
              <p className="text-muted-foreground">Carregando agentes...</p>
            </div>
          </div>
        ) : assistants.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              Nenhum agente disponível. Crie um agente primeiro.
            </p>
          </div>
        ) : selectedFollowUp ? (
          <FollowUpForm
            assistants={assistants}
            workspaceId={workspaceId}
            onSubmit={handleEditSubmit}
            isSubmitting={updateMutation.isPending}
            initialData={selectedFollowUp}
          />
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Follow-up não encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
