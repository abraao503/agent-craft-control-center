import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/auth/provider";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AgentsPage from "./pages/AgentsPage";
import CreateAgentPage from "./pages/CreateAgentPage";
import EditAgentPage from "./pages/EditAgentPage";
import AgentDetailsPage from "./pages/AgentDetailsPage";
import WhatsAppIntegrationsPage from "./pages/WhatsAppIntegrationsPage";
import CreateWhatsAppIntegrationPage from "./pages/CreateWhatsAppIntegrationPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import ContentManagementPage from "./pages/ContentManagementPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" attribute="class">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/agents/new" element={<CreateAgentPage />} />
              <Route path="/agents/edit/:id" element={<EditAgentPage />} />
              <Route path="/agents/:id" element={<AgentDetailsPage />} />
              <Route
                path="/integrations"
                element={<WhatsAppIntegrationsPage />}
              />
              <Route
                path="/integrations/new"
                element={<CreateWhatsAppIntegrationPage />}
              />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/contents" element={<ContentManagementPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
