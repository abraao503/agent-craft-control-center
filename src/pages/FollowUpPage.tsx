import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
import { FollowUpGrid } from "@/components/follow-up/FollowUpGrid";
import { FollowUp } from "@/types/follow-up";
import {
  listFollowUps,
  deleteFollowUp,
} from "@/services/follow-up";

export default function FollowUpPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const workspaceId = currentWorkspace?.id || "";

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(
    null
  );



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

  const handleEditClick = (followUp: FollowUp) => {
    navigate(`/follow-ups/edit/${followUp.id}`);
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
          onClick={() => navigate('/follow-ups/create')}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Follow-Up
        </Button>
      </div>

      {isLoading ? (
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
        />
      )}

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
