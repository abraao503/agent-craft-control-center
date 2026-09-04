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
  workspaceType?: "COMMERCIAL" | "OPERATION";
  workspaces?: Array<{ id: string; name: string }>;
}

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.PLATFORM_ADMIN]: "Admin de Plataforma",
  [UserRole.COMPANY_OWNER]: "Dono da Empresa",
  [UserRole.COMPANY_ADMIN]: "Admin da Empresa",
  [UserRole.WORKSPACE_OWNER]: "Dono do Workspace",
  [UserRole.WORKSPACE_ADMIN]: "Admin do Workspace",
  [UserRole.WORKSPACE_MANAGER]: "Gerente do Workspace",
  [UserRole.WORKSPACE_MEMBER]: "Membro operacional",
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
  [UserRole.WORKSPACE_MEMBER]: 7,
  [UserRole.SALES_REP]: 8,
};

const COMPANY_LEVEL_ROLES = [UserRole.COMPANY_OWNER, UserRole.COMPANY_ADMIN];

const WORKSPACE_LEVEL_ROLES = [
  UserRole.WORKSPACE_OWNER,
  UserRole.WORKSPACE_ADMIN,
  UserRole.WORKSPACE_MANAGER,
  UserRole.WORKSPACE_MEMBER,
  UserRole.SALES_REP,
];

const USER_CREATION_ERROR_MESSAGES: Record<string, string> = {
  "User already exists":
    "Este email já está cadastrado. Informe outro email ou use o usuário existente.",
  "Company owner already exists": "Já existe um dono para esta empresa.",
  "Workspace owner already exists": "Já existe um dono para este workspace.",
  "Workspace not found": "O workspace informado não foi encontrado.",
  "Workspace does not belong to company":
    "O workspace não pertence à empresa atual.",
  "Invalid role for context":
    "A função escolhida não é válida para este workspace.",
  Unauthorized: "Você não tem permissão para criar este usuário.",
  Forbidden: "Você não tem permissão para criar este usuário.",
};

const DEFAULT_USER_CREATION_ERROR =
  "Não foi possível criar o usuário. Verifique os dados e tente novamente.";

function getUserCreationErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return DEFAULT_USER_CREATION_ERROR;
  }

  const response = error.response;
  if (typeof response !== "object" || response === null || !("data" in response)) {
    return DEFAULT_USER_CREATION_ERROR;
  }

  const data = response.data;
  if (typeof data !== "object" || data === null || !("message" in data)) {
    return DEFAULT_USER_CREATION_ERROR;
  }

  const rawMessage = data.message;
  const messages = Array.isArray(rawMessage)
    ? rawMessage.filter((message): message is string => typeof message === "string")
    : typeof rawMessage === "string"
      ? [rawMessage]
      : [];

  if (messages.length === 0) return DEFAULT_USER_CREATION_ERROR;

  return messages
    .map((message) => USER_CREATION_ERROR_MESSAGES[message] || message)
    .join(" ");
}

export function CreateCompanyUserDialog({
  open,
  onOpenChange,
  companyId,
  workspaceId,
  workspaceType = "COMMERCIAL",
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
    ? workspaceType === "OPERATION"
      ? UserRole.WORKSPACE_MEMBER
      : UserRole.SALES_REP
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
    onSuccess: async () => {
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      });

      // Invalidate queries based on context
      if (isWorkspaceContext && workspaceId) {
        await queryClient.invalidateQueries({
          queryKey: ["workspaceUsers", companyId, workspaceId],
        });
      } else {
        await queryClient.invalidateQueries({
          queryKey: ["companyAdmins", companyId],
        });
      }

      await queryClient.invalidateQueries({
        queryKey: ["companyDetails", companyId],
      });

      resetForm();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast({
        title: "Erro",
        description: getUserCreationErrorMessage(error),
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

    const name = formData.name.trim();
    const email = formData.email.trim();

    // Validations
    if (!name || !email || !formData.password) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (name.length < 3) {
      toast({
        title: "Erro",
        description: "O nome deve ter no mínimo 3 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        title: "Erro",
        description: "Informe um email válido.",
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

    if (formData.password.length > 16) {
      toast({
        title: "Erro",
        description: "Senha deve ter no máximo 16 caracteres.",
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
      name,
      email,
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
