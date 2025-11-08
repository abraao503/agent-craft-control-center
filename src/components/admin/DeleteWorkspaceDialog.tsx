import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteWorkspace,
  DeleteWorkspaceError,
} from "@/services/workspace/deleteWorkspace";
import { Workspace } from "@/types/workspace";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { useAuth } from "@/contexts/auth/hooks";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface DeleteWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace | null;
}

const ERROR_MESSAGES: Record<DeleteWorkspaceError, string> = {
  "Workspace not found": "Workspace não encontrado.",
  "Cannot delete default workspace":
    "Não é possível deletar o workspace padrão.",
  Unauthorized: "Você não tem permissão para deletar este workspace.",
  "Failed to delete workspace":
    "Falha ao deletar o workspace. Tente novamente.",
};

export function DeleteWorkspaceDialog({
  open,
  onOpenChange,
  workspace,
}: DeleteWorkspaceDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceContext();
  const { user } = useAuth();

  // Verifica se está deletando o workspace atual e se é da mesma empresa
  const isDeletingCurrentWorkspace =
    currentWorkspace?.id === workspace?.id &&
    currentWorkspace?.companyId === user?.companyId;

  const mutation = useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: async () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["companyDetails"] });

      // Se está deletando o workspace atual da mesma empresa
      if (isDeletingCurrentWorkspace) {
        // Aguarda a lista de workspaces ser atualizada
        await queryClient.refetchQueries({ queryKey: ["workspaces"] });

        // Busca o workspace padrão
        const workspaces = queryClient.getQueryData<Workspace[]>([
          "workspaces",
        ]);
        const defaultWorkspace = workspaces?.find((w) => w.isDefault);

        if (defaultWorkspace) {
          setCurrentWorkspace(defaultWorkspace);
          toast({
            title: "Workspace deletado",
            description: `Você foi redirecionado para o workspace padrão "${defaultWorkspace.name}".`,
          });
        } else {
          toast({
            title: "Workspace deletado",
            description: "Workspace deletado com sucesso!",
          });
        }
      } else {
        toast({
          title: "Sucesso",
          description: "Workspace deletado com sucesso!",
        });
      }

      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const errorMessage = (
        error as { response?: { data?: { message?: string } } }
      ).response?.data?.message;

      const message =
        errorMessage && errorMessage in ERROR_MESSAGES
          ? ERROR_MESSAGES[errorMessage as DeleteWorkspaceError]
          : "Erro ao deletar workspace. Tente novamente.";

      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (!workspace) return;
    mutation.mutate({ workspaceId: workspace.id });
  };

  if (!workspace) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Esta ação não pode ser desfeita. O workspace{" "}
              <span className="font-semibold">{workspace.name}</span> será
              permanentemente deletado do sistema.
            </p>
            {isDeletingCurrentWorkspace && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Você está deletando o workspace atual. Após a exclusão, você
                  será redirecionado para o workspace padrão.
                </AlertDescription>
              </Alert>
            )}
            {workspace.isDefault && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Este é o workspace padrão e não pode ser deletado.
                </AlertDescription>
              </Alert>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={mutation.isPending || workspace.isDefault}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending ? "Deletando..." : "Deletar Workspace"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
