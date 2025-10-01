import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { listAgent } from "@/services/agent/listAgent";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { FollowUpForm } from "@/components/follow-up/FollowUpForm";
import {
  createFollowUp,
  listFollowUps,
  FollowUpData,
} from "@/services/follow-up";

export default function FollowUpCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const workspaceId = currentWorkspace?.id || "";

  // Fetch assistants using React Query
  const { data: agentsData, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["agents", workspaceId],
    queryFn: () => listAgent(workspaceId),
    enabled: !!workspaceId,
  });

  const assistants = agentsData?.agents || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createFollowUp,
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Follow-up criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["followUps", workspaceId] });
      navigate("/follow-ups");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error?.message || "Erro ao criar follow-up",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (data: FollowUpData) => {
    createMutation.mutate(data);
  };

  const handleGoBack = () => {
    navigate("/follow-ups");
  };

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Selecione um workspace para criar um follow-up
        </p>
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
            Criar novo Follow-Up
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {isLoadingAgents ? (
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
        ) : (
          <FollowUpForm
            assistants={assistants}
            workspaceId={workspaceId}
            onSubmit={handleCreateSubmit}
            isSubmitting={createMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
