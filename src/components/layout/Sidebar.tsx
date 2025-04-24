import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Bot,
  MessageSquare,
  Settings,
  LogOut,
  LayoutDashboard,
  Database,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-background border-r border-border h-screen flex flex-col">
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">AgentCraft</span>
        </Link>
      </div>

      <div className="p-4 flex justify-between items-center border-b border-border">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Logged in as</p>
          <p className="font-medium truncate">{user?.name}</p>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Link to="/">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              isActive("/") && "bg-accent text-primary"
            )}
          >
            <LayoutDashboard className="mr-2 h-5 w-5" />
            Dashboard
          </Button>
        </Link>

        <Link to="/agents">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              isActive("/agents") && "bg-accent text-primary"
            )}
          >
            <Bot className="mr-2 h-5 w-5" />
            Agents
          </Button>
        </Link>

        <Link to="/contents">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              isActive("/contents") && "bg-accent text-primary"
            )}
          >
            <Database className="mr-2 h-5 w-5" />
            Conteúdos
          </Button>
        </Link>

        <Link to="/integrations">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              isActive("/integrations") && "bg-accent text-primary"
            )}
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            WhatsApp
          </Button>
        </Link>

        <Link to="/settings">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              isActive("/settings") && "bg-accent text-primary"
            )}
          >
            <Settings className="mr-2 h-5 w-5" />
            Settings
          </Button>
        </Link>
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={logout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
