import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateWorkspace } from "@/services/workspace/updateWorkspace";
import { Workspace } from "@/types/workspace";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace | null;
}

export function EditWorkspaceDialog({
  open,
  onOpenChange,
  workspace,
}: EditWorkspaceDialogProps) {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
    }
  }, [workspace]);

  const mutation = useMutation({
    mutationFn: updateWorkspace,
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Workspace atualizado com sucesso!",
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["companyDetails"] });

      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Erro ao atualizar workspace";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!workspace) return;

    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do workspace é obrigatório",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      workspaceId: workspace.id,
      name: name.trim(),
    });
  };

  if (!workspace) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Workspace</DialogTitle>
          <DialogDescription>
            Altere o nome do workspace. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Workspace *</Label>
            <Input
              id="name"
              placeholder="Ex: Vendas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={mutation.isPending}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
