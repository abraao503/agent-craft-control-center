import React, {
  useState,
  useEffect,
  useRef,
} from "react";
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
import ConversationsPage from "./pages/ConversationsPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerDetailsPage from "./pages/CustomerDetailsPage";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import { SidebarProvider } from "./components/ui/sidebar";
import { cn } from "./lib/utils";
import { MainContainerRefContext } from "./contexts/mainContainer";
import { PageViewTracker } from "./components/PageViewTracker";

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
  const { user } = useAuth();
  const location = useLocation();
  const initialState = getInitialSidebarState();
  const [pageTransitioning, setPageTransitioning] = useState(false);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Detectar tema e definir variáveis CSS apenas para a sidebar
  useEffect(() => {
    // Função para definir as variáveis de acordo com o tema
    const updateSidebarColors = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      
      // Cores sólidas para a sidebar (sem transparência)
      if (isDarkMode) {
        document.documentElement.style.setProperty('--sidebar-solid-bg', '#1e1e2e');
        document.documentElement.style.setProperty('--sidebar-solid-text', '#e0e0e0');
        document.documentElement.style.setProperty('--sidebar-solid-border', '#2a2a3a');
      } else {
        document.documentElement.style.setProperty('--sidebar-solid-bg', '#ffffff');
        document.documentElement.style.setProperty('--sidebar-solid-text', '#0f0f0f');
        document.documentElement.style.setProperty('--sidebar-solid-border', '#e0e0e0');
      }
    };
    
    // Executar imediatamente
    updateSidebarColors();
    
    // Observar mudanças na classe 'dark' do documento
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' && 
          mutation.attributeName === 'class'
        ) {
          updateSidebarColors();
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
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

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <SidebarProvider defaultOpen={initialState}>
      <MainContainerRefContext.Provider value={mainContainerRef}>
        <PageViewTracker />
        <div className="flex flex-col h-screen overflow-hidden bg-background">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main
              ref={mainContainerRef}
              className={cn(
                "flex-1 p-6 bg-background overflow-y-auto dark:text-gray-200 transition-opacity",
                pageTransitioning ? "opacity-95" : "opacity-100"
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
const ConversationsListPage = () => <ConversationsPage />;
const CustomersListPage = () => <CustomersPage />;
const CustomerDetailsViewPage = () => <CustomerDetailsPage />;
const NotFoundPage = () => <NotFound />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" attribute="class">
      <AuthProvider>
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
                <Route path="/agents/:id" element={<AgentDetailsViewPage />} />
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
                <Route
                  path="/conversations"
                  element={<ConversationsListPage />}
                />
                <Route path="/customers" element={<CustomersListPage />} />
                <Route
                  path="/customers/:id"
                  element={<CustomerDetailsViewPage />}
                />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
