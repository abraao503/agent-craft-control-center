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

const SidebarMenuContent = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

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
    if (isCollapsed) {
      return (
        <Tooltip key={item.path} delayDuration={0}>
          <TooltipTrigger asChild>
            <Link to={item.path}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10",
                  isActive(item.path) && "bg-accent text-primary"
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
      <Link to={item.path} key={item.path}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            isActive(item.path) && "bg-accent text-primary"
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

      {!isCollapsed && (
        <div className="p-4 flex justify-between items-center border-b border-border">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Logged in as</p>
            <p className="font-medium truncate">{user?.name}</p>
          </div>
          <ThemeToggle />
        </div>
      )}

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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user) {
    return null;
  }

  if (!mounted) {
    return (
      <div className="w-64 bg-background border-r border-border h-screen" />
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
