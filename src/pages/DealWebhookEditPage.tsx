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

export default function DealWebhookEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
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
        title: "Webhook atualizado",
        description: "O webhook foi atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["deal-webhook", id] });
      queryClient.invalidateQueries({ queryKey: ["deal-webhooks"] });
      navigate(`/webhooks/${id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar webhook",
        description:
          error?.message || "Ocorreu um erro ao atualizar o webhook.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para o webhook.",
        variant: "destructive",
      });
      return;
    }

    if (sendWelcomeMessage && !welcomeMessage.trim()) {
      toast({
        title: "Mensagem obrigatória",
        description:
          "Por favor, informe a mensagem de boas-vindas ou desative a opção.",
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
          <h1 className="text-3xl font-bold tracking-tight">Editar Webhook</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              Webhook não encontrado ou ocorreu um erro ao carregar.
            </p>
            <Button onClick={() => navigate("/webhooks")} className="mt-4">
              Voltar para lista
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
          <h1 className="text-3xl font-bold tracking-tight">Editar Webhook</h1>
          <p className="text-muted-foreground">
            Atualize as configurações do webhook
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Webhook</CardTitle>
            <CardDescription>
              Edite as opções do webhook. A URL e a pipeline não podem ser
              alteradas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Webhook *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Integração CRM, Landing Page..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value: DealWebhookStatus) => setStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Webhooks inativos rejeitam requisições
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">
                  Configuração da Pipeline
                </h3>

                <div className="space-y-2">
                  <Label>Pipeline</Label>
                  <Input
                    value={webhook.pipeline.name}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    A pipeline não pode ser alterada após a criação
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage">Etapa</Label>
                  <Select
                    value={selectedStageId || undefined}
                    onValueChange={(value) => setSelectedStageId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Primeira etapa da pipeline" />
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
                    Se não informado, será usada a primeira etapa da pipeline
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <Label className="text-sm text-muted-foreground">
                  URL do Webhook
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
                      Mensagem de boas-vindas
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar mensagem automática ao criar o deal
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
                    <Label htmlFor="welcomeMessage">Mensagem *</Label>
                    <Textarea
                      id="welcomeMessage"
                      placeholder="Digite a mensagem de boas-vindas..."
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleGoBack}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending
                    ? "Salvando..."
                    : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
