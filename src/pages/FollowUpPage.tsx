import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { listAgent } from "@/services/agent/listAgent";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { FollowUpForm } from "@/components/follow-up/FollowUpForm";
import { FollowUpGrid } from "@/components/follow-up/FollowUpGrid";
import { FollowUp } from "@/types/follow-up";
import {
  createFollowUp,
  listFollowUps,
  updateFollowUp,
  deleteFollowUp,
  getFollowUpById,
} from "@/services/follow-up";

export default function FollowUpPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const workspaceId = currentWorkspace?.id || "";

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  // Transform agents data to the format expected by the form
  const assistants =
    agentsData?.agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
    })) || [];

  // Query follow-ups
  const {
    data: followUpsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["followUps", workspaceId],
    queryFn: () => listFollowUps({ workspaceId }),
    enabled: !!workspaceId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createFollowUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followUps", workspaceId] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Follow-up criado",
        description: "O follow-up foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar follow-up",
        description: "Ocorreu um erro ao criar o follow-up. Tente novamente.",
        variant: "destructive",
      });
      console.error("Error creating follow-up:", error);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        message?: string;
        inactiveChatTime?: number;
        assistantId?: string;
        workspaceId: string;
      };
    }) => updateFollowUp(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followUps", workspaceId] });
      setIsEditDialogOpen(false);
      setSelectedFollowUp(null);
      toast({
        title: "Follow-up atualizado",
        description: "O follow-up foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar follow-up",
        description:
          "Ocorreu um erro ao atualizar o follow-up. Tente novamente.",
        variant: "destructive",
      });
      console.error("Error updating follow-up:", error);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFollowUp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followUps", workspaceId] });
      setIsDeleteDialogOpen(false);
      setSelectedFollowUp(null);
      toast({
        title: "Follow-up excluído",
        description: "O follow-up foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir follow-up",
        description: "Ocorreu um erro ao excluir o follow-up. Tente novamente.",
        variant: "destructive",
      });
      console.error("Error deleting follow-up:", error);
    },
  });

  const handleCreateSubmit = (data: {
    name: string;
    message: string;
    inactiveChatTime: number;
    workspaceId: string;
    assistantId: string;
    inclusiveTags?: string[];
    exclusiveTags?: string[];
  }) => {
    createMutation.mutate(data);
  };

  const handleEditSubmit = (data: {
    name?: string;
    message?: string;
    inactiveChatTime?: number;
    workspaceId: string;
    assistantId?: string;
    inclusiveTags?: string[];
    exclusiveTags?: string[];
  }) => {
    if (!selectedFollowUp) return;

    updateMutation.mutate({
      id: selectedFollowUp.id,
      data,
    });
  };

  const handleEditClick = async (followUp: FollowUp) => {
    try {
      setIsLoadingFollowUp(true);
      const completeFollowUp = await getFollowUpById(followUp.id);
      console.log("completeFollowUp", completeFollowUp);
      setSelectedFollowUp(completeFollowUp);
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("Erro ao carregar dados completos do follow-up:", error);
      toast({
        title: "Erro ao carregar follow-up",
        description:
          "Não foi possível carregar os dados completos do follow-up.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFollowUp(false);
    }
  };

  const handleDeleteClick = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedFollowUp) {
      deleteMutation.mutate(selectedFollowUp.id);
    }
  };

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Selecione um workspace para visualizar os follow-ups
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Follow-Ups</h1>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          disabled={isLoadingAgents}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Follow-Up
        </Button>
      </div>

      {isLoading || isLoadingAgents ? (
        <div className="flex justify-center py-8">
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md border border-red-200">
          <p className="text-red-800">
            Erro ao carregar follow-ups. Tente novamente mais tarde.
          </p>
        </div>
      ) : (
        <FollowUpGrid
          followUps={followUpsData?.followUps || []}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          isLoadingAction={isLoadingFollowUp}
        />
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar novo Follow-Up</DialogTitle>
          </DialogHeader>
          {isLoadingAgents ? (
            <div className="py-4 text-center">
              <p className="text-muted-foreground">Carregando assistentes...</p>
            </div>
          ) : assistants.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-muted-foreground">
                Nenhum assistente disponível. Crie um assistente primeiro.
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
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Follow-Up</DialogTitle>
          </DialogHeader>
          {isLoadingFollowUp ? (
            <div className="py-8 text-center">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
                <p className="text-muted-foreground">Carregando dados do follow-up...</p>
              </div>
            </div>
          ) : isLoadingAgents ? (
            <div className="py-4 text-center">
              <p className="text-muted-foreground">Carregando assistentes...</p>
            </div>
          ) : assistants.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-muted-foreground">
                Nenhum assistente disponível. Crie um assistente primeiro.
              </p>
            </div>
          ) : (
            selectedFollowUp && (
              <FollowUpForm
                assistants={assistants}
                workspaceId={workspaceId}
                onSubmit={handleEditSubmit}
                isSubmitting={updateMutation.isPending}
                initialData={selectedFollowUp}
              />
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o follow-up "
              {selectedFollowUp?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
