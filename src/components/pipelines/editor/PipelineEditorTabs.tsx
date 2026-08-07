import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StagesTab, AgentTab, ConfigurationsTab } from "@/components/pipelines/tabs";
import { PipelineStageMinimal } from "@/types/pipeline";
import { AgentFormData } from "@/types/agent";
import { WhatsAppIntegrationName } from "@/types/whatsapp-integration";
import { WHATSAPP_INTEGRATION_NAMES } from "@/types/whatsapp-integration";
import {
  CompanyWhatsAppIntegration,
  CompanyWhatsAppIntegrationFull,
} from "@/types/whatsapp";

interface PipelineEditorTabsProps {
  activeTab: "stages" | "agent" | "config";
  onTabChange: (tab: "stages" | "agent" | "config") => void;
  pipelineName: string;
  stages: PipelineStageMinimal[];
  selectedAssistantId?: string;
  availableWhatsAppIntegrations: CompanyWhatsAppIntegration[];
  companyWhatsappIntegrationId?: string | null;
  pipelineId?: string;
  metaCloudEnabled: boolean;
  canUpdatePipeline: boolean;
  canManageIntegrations: boolean;
  metaPhoneNumberId: string | null;
  metaIntegration?: CompanyWhatsAppIntegrationFull | null;
  useAgent: boolean;
  isAgentConfigured: boolean;
  isAgentLoading: boolean;
  workspaceId?: string;
  focusedStageError?: { stageId: string; ruleIndex?: number } | null;
  onStagesChange: (stages: PipelineStageMinimal[]) => void;
  agentFormData: AgentFormData;
  updateAgentFormData: (data: Partial<AgentFormData>) => void;
  isCreating: boolean;
  onUseAgentChange: (value: boolean) => void;
  onLoadDeletedAgent: (agentData: AgentFormData) => void;
  useWhatsApp: boolean;
  whatsAppIntegrationName: WhatsAppIntegrationName;
  initialStageOrder: number;
  externalToken: string;
  externalClientToken: string;
  postbackUrl: string;
  onUseWhatsAppChange: (value: boolean) => void;
  onWhatsAppIntegrationNameChange: (value: WhatsAppIntegrationName) => void;
  onInitialStageOrderChange: (value: number) => void;
  onExternalTokenChange: (value: string) => void;
  onExternalClientTokenChange: (value: string) => void;
  onPostbackUrlChange: (value: string) => void;
  onMetaPhoneNumberIdChange: (value: string | null) => void;
}

export function PipelineEditorTabs({
  activeTab,
  onTabChange,
  pipelineName,
  stages,
  selectedAssistantId,
  availableWhatsAppIntegrations,
  companyWhatsappIntegrationId,
  pipelineId,
  metaCloudEnabled,
  canUpdatePipeline,
  canManageIntegrations,
  metaPhoneNumberId,
  metaIntegration,
  useAgent,
  isAgentConfigured,
  isAgentLoading,
  workspaceId,
  focusedStageError,
  onStagesChange,
  agentFormData,
  updateAgentFormData,
  isCreating,
  onUseAgentChange,
  onLoadDeletedAgent,
  useWhatsApp,
  whatsAppIntegrationName,
  initialStageOrder,
  externalToken,
  externalClientToken,
  postbackUrl,
  onUseWhatsAppChange,
  onWhatsAppIntegrationNameChange,
  onInitialStageOrderChange,
  onExternalTokenChange,
  onExternalClientTokenChange,
  onPostbackUrlChange,
  onMetaPhoneNumberIdChange,
}: PipelineEditorTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as typeof activeTab)}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="stages">Etapas</TabsTrigger>
        <TabsTrigger value="agent">Agente</TabsTrigger>
        <TabsTrigger value="config">Configurações</TabsTrigger>
      </TabsList>

      <TabsContent value="stages">
        <StagesTab
          pipelineName={pipelineName}
          stages={stages}
          pipelineId={pipelineId}
          selectedAssistantId={selectedAssistantId}
          availableWhatsAppIntegrations={availableWhatsAppIntegrations}
          companyWhatsappIntegrationId={companyWhatsappIntegrationId}
          isMetaCloud={
            useWhatsApp &&
            whatsAppIntegrationName === WHATSAPP_INTEGRATION_NAMES.META_CLOUD
          }
          assistantEnabled={useAgent}
          assistantConfigured={isAgentConfigured}
          assistantLoading={isAgentLoading}
          workspaceId={workspaceId}
          focusStageId={focusedStageError?.stageId}
          focusRuleIndex={focusedStageError?.ruleIndex}
          onSave={({ stages: nextStages }) => onStagesChange(nextStages)}
          onCancel={() => undefined}
          saveLabel="Aplicar"
        />
      </TabsContent>

      <TabsContent value="agent">
        <AgentTab
          formData={agentFormData}
          updateFormData={updateAgentFormData}
          isCreating={isCreating}
          useAgent={useAgent}
          onUseAgentChange={onUseAgentChange}
          hasExistingAgent={Boolean(selectedAssistantId)}
          assistantId={selectedAssistantId}
          pipelineId={pipelineId}
          workspaceId={workspaceId}
          pipelineName={pipelineName}
          stages={stages}
          isLoading={isAgentLoading}
          onLoadDeletedAgent={onLoadDeletedAgent}
        />
      </TabsContent>

      <TabsContent value="config">
        <ConfigurationsTab
          stages={stages}
          availableWhatsAppIntegrations={availableWhatsAppIntegrations}
          companyWhatsappIntegrationId={companyWhatsappIntegrationId}
          pipelineId={pipelineId}
          metaCloudEnabled={metaCloudEnabled}
          canUpdatePipeline={canUpdatePipeline}
          canManageIntegrations={canManageIntegrations}
          metaPhoneNumberId={metaPhoneNumberId}
          metaIntegration={metaIntegration}
          useWhatsApp={useWhatsApp}
          whatsAppIntegrationName={whatsAppIntegrationName}
          initialStageOrder={initialStageOrder}
          externalToken={externalToken}
          externalClientToken={externalClientToken}
          postbackUrl={postbackUrl}
          onUseWhatsAppChange={onUseWhatsAppChange}
          onWhatsAppIntegrationNameChange={onWhatsAppIntegrationNameChange}
          onInitialStageOrderChange={onInitialStageOrderChange}
          onExternalTokenChange={onExternalTokenChange}
          onExternalClientTokenChange={onExternalClientTokenChange}
          onPostbackUrlChange={onPostbackUrlChange}
          onMetaPhoneNumberIdChange={onMetaPhoneNumberIdChange}
        />
      </TabsContent>
    </Tabs>
  );
}
