import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { getDealWebhook, updateDealWebhook } from "@/services/deal-webhook";
import { listPipelineStages } from "@/services/pipeline/listPipelineStages";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import {
  UpdateDealWebhookInput,
  DealWebhookStatus,
} from "@/types/deal-webhook";
import { useTranslation } from "react-i18next";

export default function DealWebhookEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const { t } = useTranslation();
  const workspaceId = currentWorkspace?.id || "";

  const [name, setName] = useState("");
  const [status, setStatus] = useState<DealWebhookStatus>("ACTIVE");
  const [selectedStageId, setSelectedStageId] = useState("");
  const [sendWelcomeMessage, setSendWelcomeMessage] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");

  const {
    data: webhook,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["deal-webhook", id],
    queryFn: () => getDealWebhook(id!),
    enabled: !!id,
  });

  // Fetch stages for the webhook's pipeline
  const { data: stages } = useQuery({
    queryKey: ["pipeline-stages", webhook?.pipeline.id, workspaceId],
    queryFn: () => listPipelineStages(webhook!.pipeline.id, workspaceId),
    enabled: !!webhook?.pipeline.id && !!workspaceId,
  });

  // Initialize form with webhook data
  useEffect(() => {
    if (webhook) {
      setName(webhook.name);
      setStatus(webhook.status);
      setSelectedStageId(webhook.stage?.id || "");
      setSendWelcomeMessage(webhook.automation?.sendWelcomeMessage || false);
      setWelcomeMessage(webhook.automation?.welcomeMessage || "");
    }
  }, [webhook]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateDealWebhookInput) => updateDealWebhook(id!, data),
    onSuccess: () => {
      toast({
        title: t("webhookForm.updateSuccess"),
        description: t("webhookForm.updateSuccessDescription"),
      });
      queryClient.invalidateQueries({ queryKey: ["deal-webhook", id] });
      queryClient.invalidateQueries({ queryKey: ["deal-webhooks"] });
      navigate(`/webhooks/${id}`);
    },
    onError: (error: Error) => {
      toast({
        title: t("webhookForm.updateError"),
        description:
          error?.message || t("webhookForm.updateErrorDescription"),
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

    if (sendWelcomeMessage && !welcomeMessage.trim()) {
      toast({
        title: t("webhookForm.messageRequired"),
        description: t("webhookForm.messageRequiredDescription"),
        variant: "destructive",
      });
      return;
    }

    const data: UpdateDealWebhookInput = {
      name: name.trim(),
      status,
      stageId: selectedStageId || undefined,
      automation: {
        sendWelcomeMessage,
        welcomeMessage: sendWelcomeMessage ? welcomeMessage.trim() : undefined,
      },
    };

    updateMutation.mutate(data);
  };

  const handleGoBack = () => {
    navigate("/webhooks");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !webhook) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/webhooks")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{t("webhookForm.editingTitle")}</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {t("legacy.Webhook não encontrado ou ocorreu um erro ao carregar.")}
            </p>
            <Button onClick={() => navigate("/webhooks")} className="mt-4">
              {t("webhookForm.backToList")}
            </Button>
          </CardContent>
        </Card>
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
          <h1 className="text-3xl font-bold tracking-tight">{t("webhookForm.editingTitle")}</h1>
          <p className="text-muted-foreground">
            {t("webhookForm.editingDescription")}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{t("webhookForm.webhookConfiguration")}</CardTitle>
            <CardDescription>
              {t("webhookForm.editFormDescription")}
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
                <Label htmlFor="status">{t("webhookForm.statusLabel")}</Label>
                <Select
                  value={status}
                  onValueChange={(value: DealWebhookStatus) => setStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("webhookForm.statusPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t("webhooks.active")}</SelectItem>
                    <SelectItem value="INACTIVE">{t("webhooks.inactive")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("webhookForm.inactiveHelp")}
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">
                  {t("webhookForm.pipelineConfiguration")}
                </h3>

                <div className="space-y-2">
                  <Label>{t("webhookForm.pipelineLabel").replace(" *", "")}</Label>
                  <Input
                    value={webhook.pipeline.name}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("webhookForm.pipelineLockedHelp")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage">Etapa</Label>
                  <Select
                    value={selectedStageId || undefined}
                    onValueChange={(value) => setSelectedStageId(value)}
                  >
                    <SelectTrigger>
                    <SelectValue placeholder={t("webhookForm.firstStageDefault")} />
                    </SelectTrigger>
                    <SelectContent>
                      {stages?.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t("webhookForm.stageUnspecifiedHelp")}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <Label className="text-sm text-muted-foreground">
                  {t("webhookForm.urlLabel")}
                </Label>
                <p className="font-mono text-sm mt-1 break-all">
                  {webhook.webhookUrl}
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
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending
                    ? t("webhookForm.updating")
                    : t("webhookForm.updateButton")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
