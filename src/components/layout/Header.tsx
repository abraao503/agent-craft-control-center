import { useAuth } from "@/contexts/auth/hooks";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { User } from "lucide-react";

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
      <div className="flex items-center">
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="text-sm text-muted-foreground">
            <span>Logado como</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">{user?.name}</span>
            <div className="bg-muted rounded-full p-1">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
