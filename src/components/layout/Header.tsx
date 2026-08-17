import { useAuth } from "@/contexts/auth/hooks";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

const Header = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
      <div className="flex items-center"></div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="text-sm text-muted-foreground">
            <span>{t("navigation.loggedInAs")}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">{user?.name}</span>
            <div className="bg-muted rounded-full p-1">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          {import.meta.env.VITE_APP_ENV === "development" && (
            <span className="inline-flex items-center gap-2 rounded-md bg-blue-500/15 px-2.5 py-1 text-xs font-semibold uppercase text-blue-600 ring-1 ring-inset ring-blue-600/20">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              DEV
            </span>
          )}
        </div>
        <LanguageSwitcher compact />
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
