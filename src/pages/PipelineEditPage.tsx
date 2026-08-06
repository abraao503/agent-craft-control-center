import { usePipelineEditor } from "@/hooks/usePipelineEditor";
import { PipelineEditorHeader } from "@/components/pipelines/editor/PipelineEditorHeader";
import { PipelineEditorTabs } from "@/components/pipelines/editor/PipelineEditorTabs";
import { AgentLoadingModal } from "@/components/pipelines/AgentLoadingModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/usePermissions";

const PipelineEditPage = () => {
  const editor = usePipelineEditor();
  const { has } = usePermissions();

  const requiredPermission = editor.isCreating
    ? "create:pipeline"
    : "update:pipeline";

  if (!has(requiredPermission)) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        Você não tem permissão para {editor.isCreating ? "criar" : "editar"} este pipeline.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PipelineEditorHeader
        isCreating={editor.isCreating}
        onCancel={editor.handleCancel}
        onSave={editor.handleSave}
        isSaving={editor.isSaving}
      />

      <div className="space-y-2">
        <Label htmlFor="pipeline-name">Nome do funil</Label>
        <Input
          id="pipeline-name"
          placeholder="4 Novo funil"
          value={editor.pipelineName}
          onChange={(event) =>
            editor.handlePipelineNameChange(event.target.value)
          }
          className="max-w-md"
        />
      </div>

      <PipelineEditorTabs
        activeTab={editor.activeTab}
        onTabChange={editor.setActiveTab}
        pipelineName={editor.pipelineName}
        stages={editor.stages}
        selectedAssistantId={editor.currentPipeline?.assistantId || undefined}
        availableWhatsAppIntegrations={editor.availableWhatsAppIntegrations}
        companyWhatsappIntegrationId={
          editor.currentPipeline?.companyWhatsappIntegrationId
        }
        pipelineId={editor.pipelineId}
        metaCloudEnabled={editor.metaCloudEnabled}
        canUpdatePipeline={editor.canUpdatePipeline}
        canManageIntegrations={editor.canManageIntegrations}
        metaPhoneNumberId={editor.metaPhoneNumberId}
        metaIntegration={editor.metaIntegration}
        useAgent={editor.useAgent}
        isAgentConfigured={editor.isAgentConfigured}
        isAgentLoading={editor.isAgentLoading}
        workspaceId={editor.workspaceId}
        focusedStageError={editor.focusedStageError}
        onStagesChange={editor.handleStagesChange}
        agentFormData={editor.agentFormData}
        updateAgentFormData={editor.updateAgentFormData}
        isCreating={editor.isCreating}
        onUseAgentChange={editor.handleUseAgentChange}
        onLoadDeletedAgent={editor.handleLoadDeletedAgent}
        useWhatsApp={editor.useWhatsApp}
        whatsAppIntegrationName={editor.whatsAppIntegrationName}
        initialStageOrder={editor.initialStageOrder}
        externalToken={editor.externalToken}
        externalClientToken={editor.externalClientToken}
        postbackUrl={editor.postbackUrl}
        onUseWhatsAppChange={editor.handleUseWhatsAppChange}
        onWhatsAppIntegrationNameChange={
          editor.handleWhatsAppIntegrationNameChange
        }
        onInitialStageOrderChange={editor.handleInitialStageOrderChange}
        onExternalTokenChange={editor.handleExternalTokenChange}
        onExternalClientTokenChange={editor.handleExternalClientTokenChange}
        onPostbackUrlChange={editor.handlePostbackUrlChange}
        onMetaPhoneNumberIdChange={editor.handleMetaPhoneNumberIdChange}
      />

      <AgentLoadingModal
        open={editor.isSaving}
        isCreating={editor.isCreating}
        hasAgent={editor.useAgent}
      />
    </div>
  );
};

export default PipelineEditPage;
