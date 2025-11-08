import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWorkspace } from "@/services/workspace/createWorkspace";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { UserRole } from "@/services/company/listCompanyAdmins";
import { useAuth } from "@/contexts/auth/hooks";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string; // Optional - for PLATFORM_ADMIN selecting company
  companies?: Array<{ id: string; name: string }>; // For PLATFORM_ADMIN
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  companyId: propsCompanyId,
  companies = [],
}: CreateWorkspaceDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { role } = usePermissions();
  const { user } = useAuth();

  // PLATFORM_ADMIN can select company, others use their own company
  const isPlatformAdmin = role === UserRole.PLATFORM_ADMIN;
  const canCreate =
    role === UserRole.PLATFORM_ADMIN ||
    role === UserRole.COMPANY_OWNER ||
    role === UserRole.COMPANY_ADMIN;

  const [formData, setFormData] = useState({
    name: "",
    companyId: propsCompanyId || user?.companyId || "",
  });

  const createMutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: () => {
      toast({
        title: "Workspace criado",
        description: "O workspace foi criado com sucesso.",
      });

      // Invalidate queries to refresh workspace lists
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["companyDetails"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });

      onOpenChange(false);
      setFormData({
        name: "",
        companyId: propsCompanyId || user?.companyId || "",
      });
    },
    onError: (
      error: Error & { response?: { data?: { message?: string } } }
    ) => {
      toast({
        title: "Erro ao criar workspace",
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao criar o workspace.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canCreate) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para criar workspaces.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do workspace.",
        variant: "destructive",
      });
      return;
    }

    if (isPlatformAdmin && !formData.companyId) {
      toast({
        title: "Empresa obrigatória",
        description: "Por favor, selecione a empresa para o workspace.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      name: formData.name,
      companyId: formData.companyId,
    });
  };

  if (!canCreate) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Novo Workspace</DialogTitle>
            <DialogDescription>
              {isPlatformAdmin
                ? "Crie um novo workspace para uma empresa."
                : "Crie um novo workspace para sua empresa."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Company Selection - Only for PLATFORM_ADMIN */}
            {isPlatformAdmin && companies.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="company">Empresa *</Label>
                <Select
                  value={formData.companyId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, companyId: value })
                  }
                >
                  <SelectTrigger id="company">
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Workspace Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Workspace *</Label>
              <Input
                id="name"
                placeholder="Ex: Equipe de Vendas"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Criar Workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
