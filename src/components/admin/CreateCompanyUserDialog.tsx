import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { addUserToCompany } from "@/services/user/addUserToCompany";
import { UserRole } from "@/services/company/listCompanyAdmins";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { checkOwnerExists } from "@/services/user/checkOwnerExists";
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

// Role hierarchy levels (lower number = higher privilege)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.PLATFORM_ADMIN]: 1,
  [UserRole.COMPANY_OWNER]: 2,
  [UserRole.COMPANY_ADMIN]: 3,
  [UserRole.WORKSPACE_OWNER]: 4,
  [UserRole.WORKSPACE_ADMIN]: 5,
  [UserRole.WORKSPACE_MANAGER]: 6,
  [UserRole.SALES_REP]: 7,
};

const COMPANY_LEVEL_ROLES = [UserRole.COMPANY_OWNER, UserRole.COMPANY_ADMIN];

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
  const { role: currentUserRole } = usePermissions();

  // Detect context: if workspaceId is provided, we're in workspace context
  const isWorkspaceContext = !!workspaceId;

  // Filter roles based on hierarchy - user can only create roles below their level
  const getAvailableRoles = () => {
    const baseRoles = isWorkspaceContext
      ? WORKSPACE_LEVEL_ROLES
      : COMPANY_LEVEL_ROLES;

    if (!currentUserRole) return baseRoles;

    const currentLevel = ROLE_HIERARCHY[currentUserRole];

    // User can only create roles with higher level number (lower privilege)
    return baseRoles.filter((role) => {
      const targetLevel = ROLE_HIERARCHY[role];
      return targetLevel > currentLevel;
    });
  };

  const availableRoles = getAvailableRoles();

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

  // Check if owner exists when role is OWNER
  const { data: ownerCheck } = useQuery({
    queryKey: ["checkOwner", companyId, workspaceId, formData.role],
    queryFn: () => {
      if (formData.role === UserRole.COMPANY_OWNER && !isWorkspaceContext) {
        return checkOwnerExists({ companyId });
      } else if (
        formData.role === UserRole.WORKSPACE_OWNER &&
        isWorkspaceContext
      ) {
        return checkOwnerExists({ workspaceId });
      }
      return Promise.resolve({ exists: false });
    },
    enabled:
      formData.role === UserRole.COMPANY_OWNER ||
      formData.role === UserRole.WORKSPACE_OWNER,
  });

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

    // Validate hierarchy - prevent creating users at same or higher level
    if (currentUserRole && formData.role) {
      const currentLevel = ROLE_HIERARCHY[currentUserRole];
      const targetLevel = ROLE_HIERARCHY[formData.role as UserRole];

      if (targetLevel <= currentLevel) {
        toast({
          title: "Erro",
          description: "Você só pode criar usuários de nível inferior ao seu.",
          variant: "destructive",
        });
        return;
      }
    }

    // Check if owner already exists
    if (ownerCheck?.exists) {
      const ownerType = isWorkspaceContext ? "Workspace" : "Empresa";
      const ownerName =
        "ownerName" in ownerCheck ? ownerCheck.ownerName : undefined;
      toast({
        title: "Erro",
        description: `Já existe um dono para este ${ownerType}${
          ownerName ? `: ${ownerName}` : ""
        }.`,
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
      // PLATFORM_ADMIN must send companyId to create users in a specific company
      ...(currentUserRole === UserRole.PLATFORM_ADMIN && { companyId }),
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
                  <SelectItem
                    key={role}
                    value={role}
                    disabled={
                      (role === UserRole.COMPANY_OWNER && ownerCheck?.exists) ||
                      (role === UserRole.WORKSPACE_OWNER && ownerCheck?.exists)
                    }
                  >
                    {ROLE_LABELS[role]}
                    {((role === UserRole.COMPANY_OWNER &&
                      !isWorkspaceContext) ||
                      (role === UserRole.WORKSPACE_OWNER &&
                        isWorkspaceContext)) &&
                      ownerCheck?.exists && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (já existe)
                        </span>
                      )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableRoles.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Você não tem permissão para criar usuários de nível inferior.
              </p>
            )}
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
