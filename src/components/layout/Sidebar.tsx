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
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listWorkspaces } from "@/services/workspace/listWorkspaces";
import { Workspace } from "@/types/workspace";

const useWorkspace = () => {
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    () => {
      const savedWorkspace = localStorage.getItem("selectedWorkspace");
      return savedWorkspace ? JSON.parse(savedWorkspace) : null;
    }
  );

  const {
    data: workspaces,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["workspaces"],
    queryFn: listWorkspaces,
  });

  useEffect(() => {
    if (workspaces?.length > 0 && !selectedWorkspace) {
      const defaultWorkspace =
        workspaces.find((w) => w.isDefault) || workspaces[0];
      setSelectedWorkspace(defaultWorkspace);
      localStorage.setItem(
        "selectedWorkspace",
        JSON.stringify(defaultWorkspace)
      );
    } else if (workspaces?.length > 0 && selectedWorkspace) {
      // Verifica se o workspace selecionado ainda existe na lista
      const workspaceExists = workspaces.some(
        (w) => w.id === selectedWorkspace.id
      );
      if (!workspaceExists) {
        const defaultWorkspace =
          workspaces.find((w) => w.isDefault) || workspaces[0];
        setSelectedWorkspace(defaultWorkspace);
        localStorage.setItem(
          "selectedWorkspace",
          JSON.stringify(defaultWorkspace)
        );
      }
    }
  }, [workspaces, selectedWorkspace]);

  // Atualiza o workspace selecionado e salva no localStorage
  const selectWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      setSelectedWorkspace(workspace);
      localStorage.setItem("selectedWorkspace", JSON.stringify(workspace));
    }
  };

  return {
    workspaces,
    selectedWorkspace,
    selectWorkspace,
    isLoading,
    error,
  };
};

// Componente de seleção de workspace
const WorkspaceSelector = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const { workspaces, selectedWorkspace, selectWorkspace, isLoading } =
    useWorkspace();

  if (isCollapsed) {
    return (
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
    );
  }

  return (
    <div className="px-4 py-2 border-b border-border">
      <p className="text-sm text-muted-foreground mb-1">Workspace</p>
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
      path: "/conversations",
      label: "Conversas",
      icon: <MessagesSquare className="h-5 w-5" />,
    },
    {
      path: "/customers",
      label: "Customers",
      icon: <Users className="h-5 w-5" />,
    },
    {
      path: "/contents",
      label: "Conteúdos",
      icon: <Database className="h-5 w-5" />,
    },
    {
      path: "/integrations",
      label: "WhatsApp",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      path: "/settings",
      label: "Settings",
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
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold">AgentCraft</span>
          )}
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
                <span className="sr-only">Logout</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="border-border">
              Logout
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout
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
