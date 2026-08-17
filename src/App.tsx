import React, { useState, useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/auth/provider";
import { useAuth } from "./contexts/auth/hooks";
import Dashboard from "./pages/Dashboard";
import DashboardV2Page from "./pages/DashboardV2Page";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { UnsavedChangesProvider } from "./contexts/unsaved-changes/UnsavedChangesContext";
import SettingsPage from "./pages/SettingsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import MetaIntegrationPage from "./pages/MetaIntegrationPage";
import GoogleCalendarIntegrationPage from "./pages/GoogleCalendarIntegrationPage";
import CalendarPage from "./pages/CalendarPage";
import NotFound from "./pages/NotFound";
import ContentManagementPage from "./pages/ContentManagementPage";
import ChatsPage from "./pages/ChatsPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerDetailsPage from "./pages/CustomerDetailsPage";
import CustomersExportXlsxPage from "./pages/CustomersExportXlsxPage";
import FollowUpPage from "./pages/FollowUpPage";
import FollowUpCreatePage from "./pages/FollowUpCreatePage";
import FollowUpEditPage from "./pages/FollowUpEditPage";
import FollowUpDetailPage from "./pages/FollowUpDetailPage";
import PipelineDetailPage from "./pages/PipelineDetailPage";
import PipelineEditPage from "./pages/PipelineEditPage";
import MessageQueuePage from "./pages/MessageQueuePage";
import AdminCompaniesPage from "./pages/AdminCompaniesPage";
import CompanyDetailsPage from "./pages/CompanyDetailsPage";
import WorkspaceDetailsPage from "./pages/WorkspaceDetailsPage";
import CompanySettingsPage from "./pages/CompanySettingsPage";
import CompanyWorkspaceDetailsPage from "./pages/CompanyWorkspaceDetailsPage";
import WorkspaceSettingsPage from "./pages/WorkspaceSettingsPage";
import DealWebhooksPage from "./pages/DealWebhooksPage";
import DealWebhookCreatePage from "./pages/DealWebhookCreatePage";
import DealWebhookDetailPage from "./pages/DealWebhookDetailPage";
import DealWebhookEditPage from "./pages/DealWebhookEditPage";
import MassBroadcastPage from "./pages/MassBroadcastPage";
import MassBroadcastCreatePage from "./pages/MassBroadcastCreatePage";
import MassBroadcastDetailPage from "./pages/MassBroadcastDetailPage";
import CustomerImportPage from "./pages/CustomerImportPage";
import CustomerImportDetailPage from "./pages/CustomerImportDetailPage";
import IntegrationResponsePage from "./pages/IntegrationResponsePage";
import LandingPage from "./pages/LandingPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TagsPage from "./pages/TagsPage";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import { SidebarProvider } from "./components/ui/sidebar";
import { cn } from "./lib/utils";
import { MainContainerRefContext } from "./contexts/mainContainer";
import { PageViewTracker } from "./components/PageViewTracker";
import { useIsMobile } from "@/hooks/use-mobile";
import { WorkspaceProvider } from "./contexts/workspace/WorkspaceContext";
import { Loader2 } from "lucide-react";
import { LegacyTextBridge } from "./components/i18n/LegacyTextBridge";

const queryClient = new QueryClient();

// Função para obter o valor do cookie
const getCookieValue = (name: string): boolean | null => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  if (match) {
    return match[2] === "true";
  }
  return null;
};

// Recuperar o estado inicial sem depender de hooks
const getInitialSidebarState = (): boolean => {
  if (typeof document === "undefined") return true; // Para SSR
  const savedState = getCookieValue("sidebar:state");
  return savedState !== null ? savedState : true;
};

// Componente de layout persistente
const AppLayout = () => {
  const { user, isLoading } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const initialState = getInitialSidebarState();
  const [pageTransitioning, setPageTransitioning] = useState(false);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Detect dev environment
  const isDev = import.meta.env.VITE_APP_ENV === "development";

  // Apply a global dev theme class on <html>
  useEffect(() => {
    const el = document.documentElement;
    if (isDev) {
      el.classList.add("dev-theme");
    } else {
      el.classList.remove("dev-theme");
    }
  }, [isDev]);

  // Detectar tema e definir variáveis CSS apenas para a sidebar
  useEffect(() => {
    // Função para definir as variáveis de acordo com o tema
    const updateSidebarColors = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");

      // Cores sólidas para a sidebar (sem transparência)
      if (isDarkMode) {
        document.documentElement.style.setProperty(
          "--sidebar-solid-bg",
          "#1e1e2e",
        );
        document.documentElement.style.setProperty(
          "--sidebar-solid-text",
          "#e0e0e0",
        );
        document.documentElement.style.setProperty(
          "--sidebar-solid-border",
          "#2a2a3a",
        );
      } else {
        document.documentElement.style.setProperty(
          "--sidebar-solid-bg",
          "#ffffff",
        );
        document.documentElement.style.setProperty(
          "--sidebar-solid-text",
          "#0f0f0f",
        );
        document.documentElement.style.setProperty(
          "--sidebar-solid-border",
          "#e0e0e0",
        );
      }
    };

    // Executar imediatamente
    updateSidebarColors();

    // Observar mudanças na classe 'dark' do documento
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          updateSidebarColors();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // Efeito de fade suave para a troca de páginas
    setPageTransitioning(true);
    const timer = setTimeout(() => {
      setPageTransitioning(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <SidebarProvider defaultOpen={initialState}>
      <MainContainerRefContext.Provider value={mainContainerRef}>
        <PageViewTracker />
        <div
          className={cn(
            "flex flex-col h-screen overflow-hidden bg-background",
            isDev && "ring-2 ring-blue-500",
          )}
        >
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main
              ref={mainContainerRef}
              className={cn(
                "flex-1 bg-background overflow-y-auto dark:text-gray-200 transition-opacity",
                location.pathname !== "/chats" && "p-6",
                pageTransitioning ? "opacity-95" : "opacity-100",
                isMobile ? "pl-[60px]" : "",
              )}
            >
              <Outlet />
            </main>
          </div>
        </div>
      </MainContainerRefContext.Provider>
    </SidebarProvider>
  );
};

// Componentes de página simplificados sem o MainLayout
const DashboardPage = () => <Dashboard />;
const DashboardV2PageView = () => <DashboardV2Page />;
const IntegrationsViewPage = () => <IntegrationsPage />;
const MetaIntegrationViewPage = () => <MetaIntegrationPage />;
const GoogleCalendarIntegrationViewPage = () => <GoogleCalendarIntegrationPage />;
const CalendarPageView = () => <CalendarPage />;
const SettingsConfigPage = () => <SettingsPage />;
const ContentsPage = () => <ContentManagementPage />;
const ChatsListPage = () => <ChatsPage />;
const CustomersListPage = () => <CustomersPage />;
const CustomerDetailsViewPage = () => <CustomerDetailsPage />;
const CustomersExportPage = () => <CustomersExportXlsxPage />;
const FollowUpListPage = () => <FollowUpPage />;
const FollowUpCreatePageView = () => <FollowUpCreatePage />;
const FollowUpEditPageView = () => <FollowUpEditPage />;
const FollowUpDetailViewPage = () => <FollowUpDetailPage />;
const PipelineDetailViewPage = () => <PipelineDetailPage />;
const PipelineEditViewPage = () => <PipelineEditPage />;
const MessageQueueViewPage = () => <MessageQueuePage />;
const AdminCompaniesListPage = () => <AdminCompaniesPage />;
const CompanyDetailsViewPage = () => <CompanyDetailsPage />;
const WorkspaceDetailsViewPage = () => <WorkspaceDetailsPage />;
const CompanySettingsViewPage = () => <CompanySettingsPage />;
const CompanyWorkspaceDetailsViewPage = () => <CompanyWorkspaceDetailsPage />;
const WorkspaceSettingsViewPage = () => <WorkspaceSettingsPage />;
const DealWebhooksListPage = () => <DealWebhooksPage />;
const DealWebhookCreateViewPage = () => <DealWebhookCreatePage />;
const DealWebhookDetailViewPage = () => <DealWebhookDetailPage />;
const DealWebhookEditViewPage = () => <DealWebhookEditPage />;
const MassBroadcastListPage = () => <MassBroadcastPage />;
const MassBroadcastCreateViewPage = () => <MassBroadcastCreatePage />;
const MassBroadcastDetailViewPage = () => <MassBroadcastDetailPage />;
const CustomerImportListPage = () => <CustomerImportPage />;
const CustomerImportDetailViewPage = () => <CustomerImportDetailPage />;
const TagsPageView = () => <TagsPage />;
const NotFoundPage = () => <NotFound />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LegacyTextBridge />
    <ThemeProvider defaultTheme="light" attribute="class">
      <AuthProvider>
        <WorkspaceProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <UnsavedChangesProvider>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                  <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                  />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsOfServicePage />} />
                  <Route
                    path="/response/integrations"
                    element={<IntegrationResponsePage />}
                  />

                  {/* Rotas autenticadas com layout persistente */}
                  <Route element={<AppLayout />}>
                    <Route
                      path="/dashboard"
                      element={<DashboardV2PageView />}
                    />
                    <Route
                      path="/dashboard/legacy"
                      element={<DashboardPage />}
                    />
                    <Route path="/agents/*" element={<Navigate to="/deals" replace />} />
                    <Route
                      path="/integrations"
                      element={<IntegrationsViewPage />}
                    />
                    <Route
                      path="/integrations/meta"
                      element={<MetaIntegrationViewPage />}
                    />
                    <Route
                      path="/integrations/google-calendar"
                      element={<GoogleCalendarIntegrationViewPage />}
                    />
                    <Route path="/calendar" element={<CalendarPageView />} />
                    <Route path="/settings" element={<SettingsConfigPage />} />
                    <Route path="/contents" element={<ContentsPage />} />
                    <Route path="/chats" element={<ChatsListPage />} />
                    <Route path="/customers" element={<CustomersListPage />} />
                    <Route
                      path="/customers/:id"
                      element={<CustomerDetailsViewPage />}
                    />
                    <Route path="/deals" element={<PipelineDetailViewPage />} />
                    <Route
                      path="/deals/pipeline/:pipelineId"
                      element={<PipelineDetailViewPage />}
                    />
                    <Route
                      path="/deals/pipeline/create"
                      element={<PipelineEditViewPage />}
                    />
                    <Route
                      path="/deals/pipeline/:pipelineId/edit"
                      element={<PipelineEditViewPage />}
                    />
                    <Route
                      path="/deals/pipeline/:pipelineId/queue"
                      element={<MessageQueueViewPage />}
                    />
                    <Route
                      path="/customers/export-xlsx"
                      element={<CustomersExportPage />}
                    />
                    <Route path="/follow-ups" element={<FollowUpListPage />} />
                    <Route
                      path="/follow-ups/create"
                      element={<FollowUpCreatePageView />}
                    />
                    <Route
                      path="/follow-ups/edit/:id"
                      element={<FollowUpEditPageView />}
                    />
                    <Route
                      path="/follow-ups/:id"
                      element={<FollowUpDetailViewPage />}
                    />
                    <Route
                      path="/webhooks"
                      element={<DealWebhooksListPage />}
                    />
                    <Route
                      path="/webhooks/create"
                      element={<DealWebhookCreateViewPage />}
                    />
                    <Route
                      path="/webhooks/:id"
                      element={<DealWebhookDetailViewPage />}
                    />
                    <Route
                      path="/webhooks/:id/edit"
                      element={<DealWebhookEditViewPage />}
                    />
                    <Route
                      path="/broadcasts"
                      element={<MassBroadcastListPage />}
                    />
                    <Route
                      path="/broadcasts/create"
                      element={<MassBroadcastCreateViewPage />}
                    />
                    <Route
                      path="/broadcasts/:id"
                      element={<MassBroadcastDetailViewPage />}
                    />
                    <Route
                      path="/customer-imports"
                      element={<CustomerImportListPage />}
                    />
                    <Route
                      path="/customer-imports/:id"
                      element={<CustomerImportDetailViewPage />}
                    />
                    <Route path="/tags" element={<TagsPageView />} />
                    <Route
                      path="/admin/companies"
                      element={<AdminCompaniesListPage />}
                    />
                    <Route
                      path="/admin/companies/:companyId"
                      element={<CompanyDetailsViewPage />}
                    />
                    <Route
                      path="/admin/companies/:companyId/workspaces/:workspaceId"
                      element={<WorkspaceDetailsViewPage />}
                    />
                    <Route
                      path="/company/settings"
                      element={<CompanySettingsViewPage />}
                    />
                    <Route
                      path="/company/workspaces/:workspaceId"
                      element={<CompanyWorkspaceDetailsViewPage />}
                    />
                    <Route
                      path="/workspace/settings"
                      element={<WorkspaceSettingsViewPage />}
                    />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </UnsavedChangesProvider>
            </BrowserRouter>
          </TooltipProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
