import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Webhook } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listPipelines } from "@/services/pipeline/listPipelines";
import { listPipelineStages } from "@/services/pipeline/listPipelineStages";
import { createDealWebhook } from "@/services/deal-webhook";
import { CreateDealWebhookInput } from "@/types/deal-webhook";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import { useAppLocale } from "@/i18n/LocaleProvider";

export default function DealWebhookCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const { t } = useTranslation();
  const { locale } = useAppLocale();
  const workspaceId = currentWorkspace?.id || "";

  const [name, setName] = useState("");
  const [selectedPipelineId, setSelectedPipelineId] = useState("");
  const [selectedStageId, setSelectedStageId] = useState("");
  const [sendWelcomeMessage, setSendWelcomeMessage] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [createdWebhook, setCreatedWebhook] = useState<{
    id: string;
    token: string;
    webhookUrl: string;
  } | null>(null);

  // Fetch pipelines
  const { data: pipelines, isLoading: isLoadingPipelines } = useQuery({
    queryKey: ["pipelines", workspaceId],
    queryFn: () => listPipelines(workspaceId),
    enabled: !!workspaceId,
  });

  // Fetch stages for selected pipeline (for documentation display)
  const { data: stages } = useQuery({
    queryKey: ["pipeline-stages", selectedPipelineId, workspaceId],
    queryFn: () => listPipelineStages(selectedPipelineId, workspaceId),
    enabled: !!selectedPipelineId && !!workspaceId,
  });

  // Reset stage selection when pipeline changes
  useEffect(() => {
    setSelectedStageId("");
  }, [selectedPipelineId]);

  const createMutation = useMutation({
    mutationFn: (data: CreateDealWebhookInput) => createDealWebhook(data),
    onSuccess: (response) => {
      toast({
        title: t("webhookForm.createSuccess"),
        description: t("webhookForm.createSuccessDescription"),
      });
      queryClient.invalidateQueries({
        queryKey: ["deal-webhooks", workspaceId],
      });
      setCreatedWebhook(response);
    },
    onError: (error: Error) => {
      toast({
        title: t("webhookForm.createError"),
        description: error?.message || t("webhookForm.createErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: t("webhookForm.nameRequired"),
        description: t("webhookForm.nameRequiredDescription"),
        variant: "destructive",
      });
      return;
    }

    if (!selectedPipelineId) {
      toast({
        title: t("webhookForm.pipelineRequired"),
        description: t("webhookForm.pipelineRequiredDescription"),
        variant: "destructive",
      });
      return;
    }

    if (sendWelcomeMessage && !welcomeMessage.trim()) {
      toast({
        title: t("webhookForm.messageRequired"),
        description: t("webhookForm.messageRequiredDescription"),
        variant: "destructive",
      });
      return;
    }

    const data: CreateDealWebhookInput = {
      name: name.trim(),
      pipelineId: selectedPipelineId,
      workspaceId,
      stageId: selectedStageId || undefined, // Optional: first stage will be used if not provided
      automation: sendWelcomeMessage
        ? {
            sendWelcomeMessage: true,
            welcomeMessage: welcomeMessage.trim(),
          }
        : undefined,
    };

    createMutation.mutate(data);
  };

  const handleCopyUrl = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t("webhookForm.copied"),
      description: t("webhookForm.copiedDescription"),
    });
  };

  const handleGoBack = () => {
    navigate("/webhooks");
  };

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          {t("webhookForm.noWorkspaceCreate")}
        </p>
      </div>
    );
  }

  // Show success state after creation
  if (createdWebhook) {
    const examplePayload = {
      title: locale === "es-ES" ? "Nombre de la oportunidad" : "Nome do negócio",
      description:
        locale === "es-ES"
          ? "Descripción opcional de la oportunidad"
          : "Descrição opcional do negócio",
      value: 1000,
      customerName: locale === "es-ES" ? "Juan García" : "João Silva",
      customerPhone: "+5511999887766",
      customerEmail: "joao.silva@exemplo.com",
    };

    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoBack}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("webhookForm.createdTitle")}
            </h1>
            <p className="text-muted-foreground">
              {t("webhookForm.createdDescription")}
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                {t("webhookForm.integrationInformation")}
              </CardTitle>
              <CardDescription>
                {t("webhookForm.integrationInformationDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">{t("webhookForm.urlLabel")}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
                    {createdWebhook.webhookUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyUrl(createdWebhook.webhookUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">{t("webhookForm.httpMethod")}</Label>
                <div className="mt-1">
                  <code className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-semibold">
                    POST
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("webhookForm.requestExample")}</CardTitle>
              <CardDescription>
                {t("webhookForm.requestExampleDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  {t("webhookForm.headers")}
                </Label>
                <div className="bg-muted p-4 rounded-lg relative">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(
                      {
                        "Content-Type": "application/json",
                      },
                      null,
                      2,
                    )}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() =>
                      handleCopyUrl(
                        JSON.stringify(
                          { "Content-Type": "application/json" },
                          null,
                          2,
                        ),
                      )
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  {t("webhookForm.bodyJson")}
                </Label>
                <div className="bg-muted p-4 rounded-lg relative">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(examplePayload, null, 2)}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() =>
                      handleCopyUrl(JSON.stringify(examplePayload, null, 2))
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  {t("webhookForm.bodyFields")}
                </Label>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2 p-2 bg-muted/50 rounded font-medium">
                    <span>{t("webhookForm.field")}</span>
                    <span>{t("webhookForm.type")}</span>
                    <span>{t("webhookForm.required")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2">
                    <code>title</code>
                    <span>string</span>
                    <span className="text-green-600">{t("webhookForm.yes")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2 bg-muted/30">
                    <code>customerPhone</code>
                    <span>string (formato internacional)</span>
                    <span className="text-green-600">{t("webhookForm.yes")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2">
                    <code>description</code>
                    <span>string</span>
                    <span className="text-muted-foreground">{t("webhookForm.no")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2 bg-muted/30">
                    <code>value</code>
                    <span>number</span>
                    <span className="text-muted-foreground">{t("webhookForm.no")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2">
                    <code>customerName</code>
                    <span>string</span>
                    <span className="text-muted-foreground">{t("webhookForm.no")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2 bg-muted/30">
                    <code>customerEmail</code>
                    <span>email</span>
                    <span className="text-muted-foreground">{t("webhookForm.no")}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  {t("webhookForm.webhookConfiguration")}
                </Label>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span className="text-muted-foreground">{t("webhookForm.pipeline")}</span>
                    <span className="font-medium">
                      {pipelines?.find((p) => p.id === selectedPipelineId)
                        ?.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span className="text-muted-foreground">
                      {t("webhookForm.firstStage")}
                    </span>
                    <span className="font-medium">
                      {selectedStageId
                        ? stages?.find((s) => s.id === selectedStageId)?.name ||
                          "N/A"
                        : t("webhookForm.firstStageDefault")}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("webhookForm.createdDealsNote")}
                </p>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  {t("webhookForm.notes")}
                </Label>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    {t("webhookForm.phoneNote")}
                  </li>
                  <li>{t("webhookForm.titleNote")}</li>
                  <li>{t("webhookForm.phoneRequiredNote")}</li>
                  <li>{t("webhookForm.otherFieldsOptional")}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleGoBack}>
              {t("webhookForm.backToList")}
            </Button>
            <Button onClick={() => navigate(`/webhooks/${createdWebhook.id}`)}>
              {t("webhookForm.viewDetails")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("webhookForm.createTitle")}</h1>
          <p className="text-muted-foreground">
            {t("webhookForm.createDescription")}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{t("webhookForm.webhookConfiguration")}</CardTitle>
            <CardDescription>
              {t("webhookForm.formDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t("webhookForm.nameLabel")}</Label>
                <Input
                  id="name"
                  placeholder={t("webhookForm.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pipeline">{t("webhookForm.pipelineLabel")}</Label>
                {isLoadingPipelines ? (
                  <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center text-muted-foreground">
                    {t("webhookForm.loadingPipelines")}
                  </div>
                ) : (
                  <Select
                    value={selectedPipelineId}
                    onValueChange={setSelectedPipelineId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("webhookForm.pipelinePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {pipelines?.map((pipeline) => (
                        <SelectItem key={pipeline.id} value={pipeline.id}>
                          {pipeline.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("webhookForm.pipelineHelp")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">{t("webhookForm.stageLabel")}</Label>
                {!selectedPipelineId ? (
                  <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center text-muted-foreground">
                    {t("webhookForm.selectPipelineFirst")}
                  </div>
                ) : !stages || stages.length === 0 ? (
                  <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center text-muted-foreground">
                    {t("webhookForm.loadingStages")}
                  </div>
                ) : (
                  <Select
                    value={selectedStageId}
                    onValueChange={setSelectedStageId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("webhookForm.stagePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                          {stage.order !== undefined &&
                            ` (Ordem: ${stage.order + 1})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("webhookForm.stageHelp")}
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sendWelcomeMessage">
                      {t("webhookForm.welcomeMessage")}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t("webhookForm.welcomeHelp")}
                    </p>
                  </div>
                  <Switch
                    id="sendWelcomeMessage"
                    checked={sendWelcomeMessage}
                    onCheckedChange={setSendWelcomeMessage}
                  />
                </div>

                {sendWelcomeMessage && (
                  <div className="space-y-2">
                    <Label htmlFor="welcomeMessage">{t("webhookForm.messageLabel")}</Label>
                    <Textarea
                      id="welcomeMessage"
                      placeholder={t("webhookForm.messagePlaceholder")}
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleGoBack}>
                  {t("webhookForm.cancel")}
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending
                    ? t("webhookForm.creating")
                    : t("webhookForm.createButton")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
