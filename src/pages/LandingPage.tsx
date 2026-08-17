import React from "react";
import { Link, Navigate } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import {
  Bot,
  Zap,
  Shield,
  BarChart3,
  ChevronRight,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/auth/hooks";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

const LandingPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Redirect to dashboard if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="h-screen overflow-y-auto bg-background dark:bg-[#0a0a0a] flex flex-col text-foreground overflow-x-hidden pt-4">
      {/* Dynamic Header */}
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-50 rounded-2xl border border-border/40 shadow-sm mt-2 mb-8 max-w-7xl">
        <div className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <img
              src="/img/icon.png"
              alt="7 Agentes"
              className="w-6 h-6 object-contain"
            />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            7 Agentes
          </span>
        </div>
        <nav className="flex items-center space-x-2 sm:space-x-4">
          <LanguageSwitcher compact />
          <Link
            to="/login"
            className={buttonVariants({
              variant: "ghost",
              className: "hidden sm:inline-flex rounded-full px-6",
            })}
          >
            {t("landing.login")}
          </Link>
          <Link
            to="/signup"
            className={buttonVariants({
              variant: "default",
              className: "rounded-full shadow-lg shadow-primary/20 px-6",
            })}
          >
            {t("landing.createAccount")}
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-20 pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
          {/* Background decorative elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl -z-10" />

          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            {t("landing.automatedSupport")}
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            {t("landing.heroTitle")} <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
              {t("landing.artificialIntelligence")}
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            {t("landing.heroDescription")}
          </p>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link
              to="/signup"
              className={buttonVariants({
                variant: "default",
                size: "lg",
                className:
                  "rounded-full px-8 h-14 text-base shadow-xl shadow-primary/25",
              })}
            >
              {t("landing.startNow")} <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className:
                  "rounded-full px-8 h-14 text-base bg-background/50 backdrop-blur-sm",
              })}
            >
              {t("landing.customerArea")}
            </Link>
          </div>
        </section>

        {/* Features Preview Area */}
        <section className="py-24 bg-muted/30 border-y border-border/50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                {t("landing.everythingInOnePlace")}
              </h2>
              <p className="text-muted-foreground">
                {t("landing.powerfulTools")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-background rounded-3xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-shadow group">
                <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                  <Bot size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {t("landing.agentAutomation")}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("landing.agentAutomationDescription")}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-background rounded-3xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-shadow group">
                <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform">
                  <MessageSquare size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {t("landing.conversationManagement")}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("landing.conversationManagementDescription")}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-background rounded-3xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-shadow group">
                <div className="h-12 w-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 text-purple-500 group-hover:scale-110 transition-transform">
                  <Calendar size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {t("landing.nativeIntegrations")}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("landing.nativeIntegrationsDescription")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Data Usage & Transparency Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <Shield className="h-12 w-12 mx-auto text-primary mb-6" />
            <h2 className="text-3xl font-bold tracking-tight mb-6">
              {t("landing.transparentDataUse")}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              {t("landing.dataUseDescription")}
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              {t("landing.dataPermissionDescription")}
            </p>
            <a
              href="/privacy"
              className={buttonVariants({
                variant: "outline",
                className: "rounded-full px-6",
              })}
            >
              {t("landing.readPrivacy")}
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-border/40 bg-background">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="flex items-center space-x-2">
            <img
              src="/img/icon.png"
              alt="Icon"
              className="w-5 h-5 opacity-70"
            />
            <span className="text-muted-foreground font-medium">
              &copy; {new Date().getFullYear()} 7 Agentes.
            </span>
          </div>

          <div className="flex space-x-6 text-sm">
            <a
              href="/privacy"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {t("landing.privacy")}
            </a>
            <a
              href="/terms"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {t("landing.terms")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
