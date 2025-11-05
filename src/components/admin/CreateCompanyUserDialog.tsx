import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addUserToCompany } from "@/services/user/addUserToCompany";
import { UserRole } from "@/services/company/listCompanyAdmins";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateCompanyUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  workspaceId?: string; // If provided, we're in workspace context
  workspaces?: Array<{ id: string; name: string }>;
}

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.PLATFORM_ADMIN]: "Admin de Plataforma",
  [UserRole.COMPANY_OWNER]: "Dono da Empresa",
  [UserRole.COMPANY_ADMIN]: "Admin da Empresa",
  [UserRole.WORKSPACE_OWNER]: "Dono do Workspace",
  [UserRole.WORKSPACE_ADMIN]: "Admin do Workspace",
  [UserRole.WORKSPACE_MANAGER]: "Gerente do Workspace",
  [UserRole.SALES_REP]: "Vendedor",
};

const COMPANY_LEVEL_ROLES = [UserRole.COMPANY_ADMIN]; // Removed COMPANY_OWNER

const WORKSPACE_LEVEL_ROLES = [
  UserRole.WORKSPACE_OWNER,
  UserRole.WORKSPACE_ADMIN,
  UserRole.WORKSPACE_MANAGER,
  UserRole.SALES_REP,
];

export function CreateCompanyUserDialog({
  open,
  onOpenChange,
  companyId,
  workspaceId,
  workspaces = [],
}: CreateCompanyUserDialogProps) {
  // Detect context: if workspaceId is provided, we're in workspace context
  const isWorkspaceContext = !!workspaceId;
  const availableRoles = isWorkspaceContext
    ? WORKSPACE_LEVEL_ROLES
    : COMPANY_LEVEL_ROLES;
  const defaultRole = isWorkspaceContext
    ? UserRole.SALES_REP
    : UserRole.COMPANY_ADMIN;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: defaultRole,
    workspaceId: workspaceId || "",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: addUserToCompany,
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      });

      // Invalidate queries based on context
      if (isWorkspaceContext) {
        queryClient.invalidateQueries({
          queryKey: ["workspaceUsers", workspaceId],
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: ["companyAdmins", companyId],
        });
      }

      queryClient.invalidateQueries({
        queryKey: ["companyDetails", companyId],
      });

      resetForm();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Erro ao criar usuário";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: defaultRole,
      workspaceId: workspaceId || "",
    });
  };

  const requiresWorkspace = isWorkspaceContext;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Erro",
        description: "Senha deve ter no mínimo 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    // Prepare payload
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      ...(isWorkspaceContext && workspaceId && { workspaceId }),
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            {isWorkspaceContext
              ? "Adicione um novo usuário ao workspace"
              : "Adicione um novo administrador da empresa"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              placeholder="Ex: João Silva"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={mutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="Ex: joao@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={mutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              disabled={mutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value as UserRole })
              }
              disabled={mutation.isPending}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
