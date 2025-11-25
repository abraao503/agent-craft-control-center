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
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AgentsPage from "./pages/AgentsPage";
import CreateAgentPage from "./pages/CreateAgentPage";
import EditAgentPage from "./pages/EditAgentPage";
import AgentDetailsPage from "./pages/AgentDetailsPage";
import WhatsAppIntegrationsPage from "./pages/WhatsAppIntegrationsPage";
import CreateWhatsAppIntegrationPage from "./pages/CreateWhatsAppIntegrationPage";
import EditWhatsAppIntegrationPage from "./pages/EditWhatsAppIntegrationPage";
import SettingsPage from "./pages/SettingsPage";
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
import AdminCompaniesPage from "./pages/AdminCompaniesPage";
import CompanyDetailsPage from "./pages/CompanyDetailsPage";
import WorkspaceDetailsPage from "./pages/WorkspaceDetailsPage";
import CompanySettingsPage from "./pages/CompanySettingsPage";
import CompanyWorkspaceDetailsPage from "./pages/CompanyWorkspaceDetailsPage";
import WorkspaceSettingsPage from "./pages/WorkspaceSettingsPage";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import { SidebarProvider } from "./components/ui/sidebar";
import { cn } from "./lib/utils";
import { MainContainerRefContext } from "./contexts/mainContainer";
import { PageViewTracker } from "./components/PageViewTracker";
import { useIsMobile } from "@/hooks/use-mobile";
import { WorkspaceProvider } from "./contexts/workspace/WorkspaceContext";
import { Loader2 } from "lucide-react";

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
          "#1e1e2e"
        );
        document.documentElement.style.setProperty(
          "--sidebar-solid-text",
          "#e0e0e0"
        );
        document.documentElement.style.setProperty(
          "--sidebar-solid-border",
          "#2a2a3a"
        );
      } else {
        document.documentElement.style.setProperty(
          "--sidebar-solid-bg",
          "#ffffff"
        );
        document.documentElement.style.setProperty(
          "--sidebar-solid-text",
          "#0f0f0f"
        );
        document.documentElement.style.setProperty(
          "--sidebar-solid-border",
          "#e0e0e0"
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
            isDev && "ring-2 ring-blue-500"
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
                isMobile ? "pl-[60px]" : ""
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
const AgentsListPage = () => <AgentsPage />;
const AgentCreatePage = () => <CreateAgentPage />;
const AgentEditPage = () => <EditAgentPage />;
const AgentDetailsViewPage = () => <AgentDetailsPage />;
const IntegrationsListPage = () => <WhatsAppIntegrationsPage />;
const IntegrationsCreatePage = () => <CreateWhatsAppIntegrationPage />;
const IntegrationsEditPage = () => <EditWhatsAppIntegrationPage />;
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
const AdminCompaniesListPage = () => <AdminCompaniesPage />;
const CompanyDetailsViewPage = () => <CompanyDetailsPage />;
const WorkspaceDetailsViewPage = () => <WorkspaceDetailsPage />;
const CompanySettingsViewPage = () => <CompanySettingsPage />;
const CompanyWorkspaceDetailsViewPage = () => <CompanyWorkspaceDetailsPage />;
const WorkspaceSettingsViewPage = () => <WorkspaceSettingsPage />;
const NotFoundPage = () => <NotFound />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" attribute="class">
      <AuthProvider>
        <WorkspaceProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Rotas autenticadas com layout persistente */}
                <Route element={<AppLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/agents" element={<AgentsListPage />} />
                  <Route path="/agents/new" element={<AgentCreatePage />} />
                  <Route path="/agents/edit/:id" element={<AgentEditPage />} />
                  <Route
                    path="/agents/:id"
                    element={<AgentDetailsViewPage />}
                  />
                  <Route
                    path="/integrations"
                    element={<IntegrationsListPage />}
                  />
                  <Route
                    path="/integrations/new"
                    element={<IntegrationsCreatePage />}
                  />
                  <Route
                    path="/integrations/edit/:id"
                    element={<IntegrationsEditPage />}
                  />
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
            </BrowserRouter>
          </TooltipProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
