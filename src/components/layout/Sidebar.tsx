import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bot,
  MessageSquare,
  Settings,
  LogOut,
  LayoutDashboard,
  Database,
  MessagesSquare,
  Users,
  ChevronLeft,
  ChevronRight,
  Building2,
  Plus,
  BellRing,
  DollarSignIcon,
  Webhook,
  Megaphone,
  Calendar as CalendarIcon,
  Tag,
  Radio,
  Inbox,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/contexts/auth/hooks";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/types/auth";
import {
  Sidebar as SidebarComponent,
  SidebarContent as SidebarContentComponent,
  useSidebar,
} from "@/components/ui/sidebar";
import { Plug } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listWorkspaces } from "@/services/workspace/listWorkspaces";
import {
  createWorkspace,
  CreateWorkspaceParams,
} from "@/services/workspace/createWorkspace";
import { Workspace, WorkspaceType } from "@/types/workspace";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { AxiosError } from "axios";
import { useUnsavedChanges } from "@/contexts/unsaved-changes/UnsavedChangesContext";
import { useTranslation } from "react-i18next";

const useWorkspace = () => {
  const queryClient = useQueryClient();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceContext();
  const { user } = useAuth();

  const {
    data: workspaces = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["workspaces", user?.companyId],
    queryFn: listWorkspaces,
    enabled: Boolean(user?.companyId),
    // Refetch quando a janela recebe foco para garantir dados atualizados
    refetchOnWindowFocus: true,
  });

  // Mutation para criar um novo workspace
  const createWorkspaceMutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: (newWorkspace) => {
      // Invalidar a query para recarregar a lista de workspaces
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });

      // Se o workspace criado é da mesma empresa do usuário, seleciona-o
      if (newWorkspace.companyId === user?.companyId) {
        setCurrentWorkspace(newWorkspace);
      }
    },
  });

  useEffect(() => {
    if (workspaces && workspaces.length > 0) {
      const preferredWorkspace = user?.workspaceId
        ? workspaces.find((workspace) => workspace.id === user.workspaceId)
        : undefined;

      // Se não há workspace selecionado, seleciona o padrão ou o primeiro
      if (!currentWorkspace) {
        const defaultWorkspace =
          preferredWorkspace || workspaces.find((w) => w.isDefault) || workspaces[0];
        setCurrentWorkspace(defaultWorkspace);
      } else if (preferredWorkspace && currentWorkspace.id !== preferredWorkspace.id) {
        setCurrentWorkspace(preferredWorkspace);
      } else {
        // Verifica se o workspace atual ainda existe na lista
        const workspaceExists = workspaces.some(
          (w) => w.id === currentWorkspace.id,
        );

        if (!workspaceExists) {
          // Se o workspace foi deletado, seleciona o padrão
          const defaultWorkspace =
            workspaces.find((w) => w.isDefault) || workspaces[0];
          setCurrentWorkspace(defaultWorkspace);
        } else {
          // Atualiza os dados do workspace atual (caso o nome tenha sido editado)
          const updatedWorkspace = workspaces.find(
            (w) => w.id === currentWorkspace.id,
          );
          if (
            updatedWorkspace &&
            updatedWorkspace.name !== currentWorkspace.name
          ) {
            setCurrentWorkspace(updatedWorkspace);
          }
        }
      }
    }
  }, [workspaces, currentWorkspace, setCurrentWorkspace, user?.workspaceId]);

  // Atualiza o workspace selecionado
  const selectWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
    }
  };

  // Função para adicionar um novo workspace
  const addWorkspace = async (params: CreateWorkspaceParams) => {
    const newWorkspace = await createWorkspaceMutation.mutateAsync(params);
    return newWorkspace;
  };

  return {
    workspaces: workspaces || [],
    selectedWorkspace: currentWorkspace,
    selectWorkspace,
    addWorkspace,
    isLoading,
    isCreating: createWorkspaceMutation.isPending,
    error,
  };
};

// Componente de diálogo para criar novo workspace
interface WorkspaceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceName: string;
  workspaceType: WorkspaceType;
  onWorkspaceNameChange: (name: string) => void;
  onWorkspaceTypeChange: (type: WorkspaceType) => void;
  onCreateWorkspace: () => void;
  isCreating: boolean;
}

const WorkspaceDialog = ({
  isOpen,
  onOpenChange,
  workspaceName,
  workspaceType,
  onWorkspaceNameChange,
  onWorkspaceTypeChange,
  onCreateWorkspace,
  isCreating,
}: WorkspaceDialogProps) => {
  const { t } = useTranslation();
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("legacy.Criar novo workspace")}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="workspace-name">{t("legacy.Nome do workspace")}</Label>
          <Input
            id="workspace-name"
            value={workspaceName}
            onChange={(e) => onWorkspaceNameChange(e.target.value)}
            placeholder={t("legacy.Digite o nome do workspace")}
            className="mt-2"
            autoFocus
          />
          <Label htmlFor="workspace-type" className="mt-4 block">
            Tipo do workspace
          </Label>
          <Select
            value={workspaceType}
            onValueChange={(value) => onWorkspaceTypeChange(value as WorkspaceType)}
          >
            <SelectTrigger id="workspace-type" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COMMERCIAL">Comercial</SelectItem>
              <SelectItem value="OPERATION">Operação</SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-2 text-xs text-muted-foreground">
            O tipo define os módulos e não pode ser alterado depois.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onCreateWorkspace}
            disabled={!workspaceName.trim() || isCreating}
          >
            {isCreating ? t("common.creating") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Componente de seleção de workspace
const WorkspaceSelector = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const {
    workspaces,
    selectedWorkspace,
    selectWorkspace,
    addWorkspace,
    isLoading,
    isCreating,
  } = useWorkspace();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceType, setNewWorkspaceType] = useState<WorkspaceType>("COMMERCIAL");
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const { has } = usePermissions();
  const { t } = useTranslation();

  const isSalesRep = userProfile?.role === "SALES_REP";
  const canCreateWorkspace = has("create:workspace");

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    try {
      // Criar o novo workspace e obter o resultado
      const newWorkspace = await addWorkspace({
        name: newWorkspaceName.trim(),
        type: newWorkspaceType,
      });

      // Selecionar o novo workspace
      if (newWorkspace?.id) {
        selectWorkspace(newWorkspace.id);
      }

      // Mostrar toast de sucesso
      toast({
        title: t("common.success"),
        description: t("legacy.Workspace \"{{name}}\" criado com sucesso!", { name: newWorkspaceName.trim() }),
        variant: "default",
      });

      // Limpar o formulário e fechar o diálogo
      setNewWorkspaceName("");
      setNewWorkspaceType("COMMERCIAL");
      setIsDialogOpen(false);
    } catch (error: unknown) {
      console.error("Erro ao criar workspace:", error);

      // Verificar se é erro de nome duplicado
      if (error instanceof AxiosError) {
        if (
          error?.response?.data?.message === "Workspace name already exists"
        ) {
          toast({
            title: t("common.error"),
            description:
              t("legacy.Este nome de workspace já existe. Por favor, escolha outro nome."),
            variant: "destructive",
          });
        }

        return;
      }

      toast({
        title: t("common.error"),
        description: t("legacy.Ocorreu um erro ao criar o workspace. Tente novamente."),
        variant: "destructive",
      });
    }
  };

  if (isCollapsed) {
    return (
      <>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="flex justify-center items-center py-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="border-border">
            {selectedWorkspace?.name || t("common.loading")}
          </TooltipContent>
        </Tooltip>
        {canCreateWorkspace && !isSalesRep && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-8 flex justify-center"
                aria-label={t("legacy.Criar novo workspace")}
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="border-border">
              {t("legacy.Criar novo workspace")}
            </TooltipContent>
          </Tooltip>
        )}

        <WorkspaceDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          workspaceName={newWorkspaceName}
          workspaceType={newWorkspaceType}
          onWorkspaceNameChange={setNewWorkspaceName}
          onWorkspaceTypeChange={setNewWorkspaceType}
          onCreateWorkspace={handleCreateWorkspace}
          isCreating={isCreating}
        />
      </>
    );
  }

  return (
    <div className="px-4 py-2">
      <div className="flex justify-between items-center mb-1">
        <p className="text-sm text-muted-foreground">{t("navigation.workspace")}</p>
      </div>
      {isLoading ? (
        <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center text-muted-foreground">
          {t("common.loading")}
        </div>
      ) : isSalesRep ? (
        <div
          key={selectedWorkspace?.id ?? "loading"}
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center text-foreground"
        >
          {selectedWorkspace?.name || t("common.loading")}
        </div>
      ) : (
        <Select
          value={selectedWorkspace?.id}
          onValueChange={(value) => selectWorkspace(value)}
          disabled={isLoading || workspaces.length === 0}
        >
          <SelectTrigger className="w-full">
          <SelectValue placeholder={t("legacy.Selecione um workspace")} />
          </SelectTrigger>
          <SelectContent>
            {workspaces.map((workspace) => (
              <SelectItem key={workspace.id} value={workspace.id}>
                {workspace.name}
                {workspace.type === "OPERATION" ? " · Operação" : " · Comercial"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <WorkspaceDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        workspaceName={newWorkspaceName}
        workspaceType={newWorkspaceType}
        onWorkspaceNameChange={setNewWorkspaceName}
        onWorkspaceTypeChange={setNewWorkspaceType}
        onCreateWorkspace={handleCreateWorkspace}
        isCreating={isCreating}
      />
    </div>
  );
};

const SidebarMenuContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const { requestNavigation } = useUnsavedChanges();
  const { has, hasAny, role } = usePermissions();
  const { currentWorkspace } = useWorkspaceContext();
  const isCollapsed = state === "collapsed";
  const { isLoading: isWorkspaceLoading } = useWorkspace();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const handleLogout = () => {
    // Limpa todo o cache do React Query antes de deslogar
    // para evitar que dados de um usuário apareçam para outro
    queryClient.clear();
    logout();
  };

  const isActive = (path: string) => {
    if (path === "/dashboard" || path === "/operation") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  interface MenuItem {
    path: string;
    label: string;
    icon: JSX.Element;
    requiredPermission?: Permission;
    requiredPermissions?: Permission[];
  }

  const allMenuItems: MenuItem[] = currentWorkspace?.type === "OPERATION"
    ? [
        {
          path: "/operation/attendances",
          label: "Atendimentos",
          icon: <Inbox className="h-5 w-5" />,
          requiredPermission: "view:operation-attendances",
        },
        {
          path: "/operation",
          label: "Operação",
          icon: <Building2 className="h-5 w-5" />,
          requiredPermission: "view:operation-setup",
        },
        {
          path: "/operation/channels",
          label: "Canais",
          icon: <Radio className="h-5 w-5" />,
          requiredPermission: "view:operation-channels",
        },
        {
          path: "/operation/agents",
          label: "Agentes",
          icon: <Bot className="h-5 w-5" />,
          requiredPermissions: ["view:assistant", "manage:operation-setup"],
        },
        {
          path: "/operation/distribution",
          label: "Distribuição",
          icon: <SlidersHorizontal className="h-5 w-5" />,
          requiredPermission: "manage:operation-setup",
        },
      ]
    : [
    {
      path: "/dashboard",
      label: t("navigation.dashboard"),
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    // { path: "/agents", label: "Agents", icon: <Bot className="h-5 w-5" /> },
    {
      path: "/chats",
      label: t("navigation.conversations"),
      icon: <MessagesSquare className="h-5 w-5" />,
    },
    {
      path: "/deals",
      label: t("navigation.opportunities"),
      icon: <DollarSignIcon className="h-5 w-5" />,
    },
    {
      path: "/calendar",
      label: t("navigation.calendar"),
      icon: <CalendarIcon className="h-5 w-5" />,
    },
    {
      path: "/customers",
      label: t("navigation.customers"),
      icon: <Users className="h-5 w-5" />,
    },
    {
      path: "/webhooks",
      label: t("navigation.webhooks"),
      icon: <Webhook className="h-5 w-5" />,
    },
    {
      path: "/broadcasts",
      label: t("navigation.broadcasts"),
      icon: <Megaphone className="h-5 w-5" />,
    },
    {
      path: "/integrations",
      label: t("navigation.integrations"),
      icon: <Plug className="h-5 w-5" />,
    },
    {
      path: "/tags",
      label: t("navigation.tags"),
      icon: <Tag className="h-5 w-5" />,
    },
    // {
    //   path: "/contents",
    //   label: "Conteúdos",
    //   icon: <Database className="h-5 w-5" />,
    // },
    // {
    //   path: "/follow-ups",
    //   label: "Follow-Ups",
    //   icon: <BellRing className="h-5 w-5" />,
    // },
    // {
    //   path: "/settings",
    //   label: "Configurações",
    //   icon: <Settings className="h-5 w-5" />,
    // },
  ];

  // A role é a fonte de verdade para a hierarquia de navegação. Permissões
  // continuam controlando cada ação e são validadas pela API.
  if (role === "PLATFORM_ADMIN") {
    allMenuItems.push({
      path: "/admin/companies",
      label: t("navigation.administration"),
      icon: <Building2 className="h-5 w-5" />,
    });
  } else if (role === "COMPANY_OWNER" || role === "COMPANY_ADMIN") {
    allMenuItems.push({
      path: "/company/settings",
      label: t("navigation.administration"),
      icon: <Building2 className="h-5 w-5" />,
    });
  } else if (
    role === "WORKSPACE_OWNER" ||
    role === "WORKSPACE_ADMIN" ||
    role === "WORKSPACE_MANAGER"
  ) {
    allMenuItems.push({
      path: "/workspace/settings",
      label: t("navigation.administration"),
      icon: <Building2 className="h-5 w-5" />,
    });
  }
  // SALES_REP não vê Administração.

  const menuItems = allMenuItems.filter((item) => {
    if (item.requiredPermission) {
      return has(item.requiredPermission);
    }
    if (item.requiredPermissions) {
      return hasAny(item.requiredPermissions);
    }
    return true;
  });

  const operationHomePath =
    currentWorkspace?.type === "OPERATION"
      ? has("view:operation-setup")
        ? "/operation"
        : has("view:operation-attendances")
          ? "/operation/attendances"
          : "/operation"
      : "/dashboard";

  const renderMenuItem = (item: {
    path: string;
    label: string;
    icon: JSX.Element;
  }) => {
    // Verifica se o item deve estar desativado (quando workspaces estão carregando e não é a página atual)
    const isDisabled = isWorkspaceLoading && !isActive(item.path);

    if (isCollapsed) {
      return (
        <Tooltip key={item.path} delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              to={item.path}
              tabIndex={isDisabled ? -1 : undefined}
              onClick={(event) => {
                event.preventDefault();
                if (!isDisabled) requestNavigation(() => navigate(item.path));
              }}
            >
              <Button
                variant="ghost"
                size="icon"
                disabled={isDisabled}
                className={cn(
                  "h-10 w-10",
                  isActive(item.path) && "bg-accent text-primary",
                  isDisabled &&
                    "opacity-50 cursor-not-allowed pointer-events-none",
                )}
              >
                {item.icon}
                <span className="sr-only">{item.label}</span>
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="border-border">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link
        to={item.path}
        key={item.path}
        tabIndex={isDisabled ? -1 : undefined}
        onClick={(event) => {
          event.preventDefault();
          if (!isDisabled) requestNavigation(() => navigate(item.path));
        }}
      >
        <Button
          variant="ghost"
          disabled={isDisabled}
          className={cn(
            "w-full justify-start",
            isActive(item.path) && "bg-accent",
            isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
          )}
        >
          <span className="mr-2">{item.icon}</span>
          {item.label}
        </Button>
      </Link>
    );
  };

  return (
    <>
      <div
        className={cn(
          "p-4 border-b border-border",
          isCollapsed && "flex justify-center items-center",
        )}
      >
        <Link
          to={operationHomePath}
          onClick={(event) => {
            event.preventDefault();
            requestNavigation(() =>
              navigate(operationHomePath),
            );
          }}
          className={cn(
            "flex items-center space-x-2",
            isCollapsed && "flex-col space-x-0 space-y-2",
          )}
        >
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <img src="/img/icon.png" alt="App icon" className="w-6 h-6" />
          </div>
          {!isCollapsed && <span className="text-lg font-bold">7 Agentes</span>}
        </Link>
      </div>

      <WorkspaceSelector isCollapsed={isCollapsed} />

      <nav
        className={cn(
          "flex-1 p-4 space-y-2",
          isCollapsed && "flex flex-col items-center px-2 py-4 space-y-4",
        )}
      >
        {menuItems.map(renderMenuItem)}
      </nav>

      <div
        className={cn(
          "p-4 border-t border-border mt-auto",
          isCollapsed && "flex justify-center p-2",
        )}
      >
        {isCollapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">{t("navigation.logout")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="border-border">
              {t("navigation.logout")}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-5 w-5" />
            {t("navigation.logout")}
          </Button>
        )}
      </div>
    </>
  );
};

const ToggleButton = () => {
  const { toggleSidebar, state } = useSidebar();
  const { t } = useTranslation();
  const isCollapsed = state === "collapsed";
  const label = t("navigation.toggleSidebar");

  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute right-[-12px] top-4 h-6 w-6 rounded-full border bg-background shadow-sm z-10"
      onClick={toggleSidebar}
      aria-label={label}
      title={label}
    >
      {isCollapsed ? (
        <ChevronRight className="h-3 w-3" />
      ) : (
        <ChevronLeft className="h-3 w-3" />
      )}
    </Button>
  );
};

const Sidebar = () => {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const isOperationStation =
    location.pathname === "/operation/attendances" ||
    location.pathname.startsWith("/operation/attendances/");

  // Fechar a navegação ao entrar na estação; não reagir ao toggle do usuário.
  useEffect(() => {
    if (isMobile && isOperationStation) {
      setOpenMobile(false);
    }

    if (!mounted) {
      setMounted(true);
    }
  }, [location.pathname, isMobile, isOperationStation, setOpenMobile, mounted]);

  if (!user) {
    return null;
  }

  if (!mounted) {
    // Renderizar uma versão "vazia" consistente com o estado atual
    return (
      <div className={cn("h-screen border-r border-border transition-all")} />
    );
  }

  return (
    <SidebarComponent collapsible="icon" className="border-r border-border">
      <SidebarContentComponent>
        <SidebarMenuContent />
        <ToggleButton />
      </SidebarContentComponent>
    </SidebarComponent>
  );
};

export default Sidebar;
