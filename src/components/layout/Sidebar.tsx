import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { useAuth } from "@/contexts/auth/hooks";
import {
  Sidebar as SidebarComponent,
  SidebarContent as SidebarContentComponent,
  useSidebar,
} from "@/components/ui/sidebar";
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
import { Workspace } from "@/types/workspace";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { AxiosError } from "axios";

const useWorkspace = () => {
  const queryClient = useQueryClient();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceContext();

  const {
    data: workspaces,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["workspaces"],
    queryFn: listWorkspaces,
  });

  // Mutation para criar um novo workspace
  const createWorkspaceMutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: () => {
      // Invalidar a query para recarregar a lista de workspaces
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  useEffect(() => {
    if (workspaces?.length > 0 && !currentWorkspace) {
      const defaultWorkspace =
        workspaces.find((w) => w.isDefault) || workspaces[0];
      setCurrentWorkspace(defaultWorkspace);
    } else if (workspaces?.length > 0 && currentWorkspace) {
      // Verifica se o workspace selecionado ainda existe na lista
      const workspaceExists = workspaces.some(
        (w) => w.id === currentWorkspace.id
      );
      if (!workspaceExists) {
        const defaultWorkspace =
          workspaces.find((w) => w.isDefault) || workspaces[0];
        setCurrentWorkspace(defaultWorkspace);
      }
    }
  }, [workspaces, currentWorkspace, setCurrentWorkspace]);

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
    workspaces,
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
  onWorkspaceNameChange: (name: string) => void;
  onCreateWorkspace: () => void;
  isCreating: boolean;
}

const WorkspaceDialog = ({
  isOpen,
  onOpenChange,
  workspaceName,
  onWorkspaceNameChange,
  onCreateWorkspace,
  isCreating,
}: WorkspaceDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar novo workspace</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="workspace-name">Nome do workspace</Label>
          <Input
            id="workspace-name"
            value={workspaceName}
            onChange={(e) => onWorkspaceNameChange(e.target.value)}
            placeholder="Digite o nome do workspace"
            className="mt-2"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button
            onClick={onCreateWorkspace}
            disabled={!workspaceName.trim() || isCreating}
          >
            {isCreating ? "Criando..." : "Criar"}
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
  const { toast } = useToast();

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    try {
      // Criar o novo workspace e obter o resultado
      const newWorkspace = await addWorkspace({
        name: newWorkspaceName.trim(),
      });

      // Selecionar o novo workspace
      if (newWorkspace?.id) {
        selectWorkspace(newWorkspace.id);
      }

      // Mostrar toast de sucesso
      toast({
        title: "Sucesso",
        description: `Workspace "${newWorkspaceName.trim()}" criado com sucesso!`,
        variant: "default",
      });

      // Limpar o formulário e fechar o diálogo
      setNewWorkspaceName("");
      setIsDialogOpen(false);
    } catch (error: unknown) {
      console.error("Erro ao criar workspace:", error);

      // Verificar se é erro de nome duplicado
      if (error instanceof AxiosError) {
        if (
          error?.response?.data?.message === "Workspace name already exists"
        ) {
          toast({
            title: "Erro",
            description:
              "Este nome de workspace já existe. Por favor, escolha outro nome.",
            variant: "destructive",
          });
        }

        return;
      }

      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar o workspace. Tente novamente.",
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
            {selectedWorkspace?.name || "Carregando..."}
          </TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-8 flex justify-center"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="border-border">
            Criar novo workspace
          </TooltipContent>
        </Tooltip>

        <WorkspaceDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          workspaceName={newWorkspaceName}
          onWorkspaceNameChange={setNewWorkspaceName}
          onCreateWorkspace={handleCreateWorkspace}
          isCreating={isCreating}
        />
      </>
    );
  }

  return (
    <div className="px-4 py-2 border-b border-border">
      <div className="flex justify-between items-center mb-1">
        <p className="text-sm text-muted-foreground">Workspace</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      {isLoading ? (
        <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center text-muted-foreground">
          Carregando...
        </div>
      ) : (
        <Select
          value={selectedWorkspace?.id}
          onValueChange={(value) => selectWorkspace(value)}
          disabled={isLoading || workspaces.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um workspace" />
          </SelectTrigger>
          <SelectContent>
            {workspaces.map((workspace) => (
              <SelectItem key={workspace.id} value={workspace.id}>
                {workspace.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <WorkspaceDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        workspaceName={newWorkspaceName}
        onWorkspaceNameChange={setNewWorkspaceName}
        onCreateWorkspace={handleCreateWorkspace}
        isCreating={isCreating}
      />
    </div>
  );
};

const SidebarMenuContent = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { isLoading: isWorkspaceLoading } = useWorkspace();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    { path: "/agents", label: "Agents", icon: <Bot className="h-5 w-5" /> },
    {
      path: "/chats",
      label: "Conversas",
      icon: <MessagesSquare className="h-5 w-5" />,
    },
    {
      path: "/customers",
      label: "Clientes",
      icon: <Users className="h-5 w-5" />,
    },
    {
      path: "/deals",
      label: "Negócios",
      icon: <DollarSignIcon className="h-5 w-5" />,
    },
    {
      path: "/contents",
      label: "Conteúdos",
      icon: <Database className="h-5 w-5" />,
    },
    {
      path: "/follow-ups",
      label: "Follow-Ups",
      icon: <BellRing className="h-5 w-5" />,
    },
    {
      path: "/integrations",
      label: "WhatsApp",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      path: "/settings",
      label: "Configurações",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

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
            <Link to={item.path} tabIndex={isDisabled ? -1 : undefined}>
              <Button
                variant="ghost"
                size="icon"
                disabled={isDisabled}
                className={cn(
                  "h-10 w-10",
                  isActive(item.path) && "bg-accent text-primary",
                  isDisabled &&
                    "opacity-50 cursor-not-allowed pointer-events-none"
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
      >
        <Button
          variant="ghost"
          disabled={isDisabled}
          className={cn(
            "w-full justify-start",
            isActive(item.path) && "bg-accent",
            isDisabled && "opacity-50 cursor-not-allowed pointer-events-none"
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
          isCollapsed && "flex justify-center items-center"
        )}
      >
        <Link
          to="/"
          className={cn(
            "flex items-center space-x-2",
            isCollapsed && "flex-col space-x-0 space-y-2"
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
          isCollapsed && "flex flex-col items-center px-2 py-4 space-y-4"
        )}
      >
        {menuItems.map(renderMenuItem)}
      </nav>

      <div
        className={cn(
          "p-4 border-t border-border mt-auto",
          isCollapsed && "flex justify-center p-2"
        )}
      >
        {isCollapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={logout}
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Sair</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="border-border">
              Sair
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sair
          </Button>
        )}
      </div>
    </>
  );
};

const ToggleButton = () => {
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute right-[-12px] top-4 h-6 w-6 rounded-full border bg-background shadow-sm z-10"
      onClick={toggleSidebar}
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
  const { state, setOpen } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Efeito simplificado para manter o estado da sidebar durante navegação
  useEffect(() => {
    // O efeito aqui é mínimo apenas para garantir que o estado seja preservado
    if (isCollapsed) {
      // Aplicar o estado colapsado sem setTimeout para evitar o flash
      setOpen(false);
    }

    if (!mounted) {
      setMounted(true);
    }
  }, [location.pathname, isCollapsed, setOpen, mounted]);

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
