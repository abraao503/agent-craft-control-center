import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUser } from "@/services/user/deleteUser";
import { User } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
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

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  workspaceId?: string;
  companyId?: string;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  workspaceId,
  companyId,
}: DeleteUserDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Usuário deletado com sucesso!",
      });

      // Invalidate queries based on context
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: ["workspaceUsers", workspaceId],
        });
      }

      if (companyId) {
        queryClient.invalidateQueries({
          queryKey: ["companyAdmins", companyId],
        });
        queryClient.invalidateQueries({
          queryKey: ["companyDetails", companyId],
        });
      }

      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Erro ao deletar usuário";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (!user) return;
    mutation.mutate({ userId: user.id });
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. O usuário{" "}
            <span className="font-semibold">{user.name}</span> (
            <span className="text-muted-foreground">{user.email}</span>) será
            permanentemente deletado do sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={mutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending ? "Deletando..." : "Deletar Usuário"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
