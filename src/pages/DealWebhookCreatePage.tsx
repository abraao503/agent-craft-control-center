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

export default function DealWebhookCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
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
        title: "Webhook criado",
        description: "O webhook foi criado com sucesso!",
      });
      queryClient.invalidateQueries({
        queryKey: ["deal-webhooks", workspaceId],
      });
      setCreatedWebhook(response);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar webhook",
        description: error?.message || "Ocorreu um erro ao criar o webhook.",
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

    if (!selectedPipelineId) {
      toast({
        title: "Pipeline obrigatória",
        description: "Por favor, selecione uma pipeline.",
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
      title: "Copiado!",
      description: "Texto copiado para a área de transferência.",
    });
  };

  const handleGoBack = () => {
    navigate("/webhooks");
  };

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Selecione um workspace para criar um webhook
        </p>
      </div>
    );
  }

  // Show success state after creation
  if (createdWebhook) {
    const examplePayload = {
      title: "Nome do negócio",
      description: "Descrição opcional do negócio",
      value: 1000,
      customerName: "João Silva",
      customerPhone: "11999999999",
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
              Webhook Criado!
            </h1>
            <p className="text-muted-foreground">
              Configure seu sistema externo com as informações abaixo
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Informações do Webhook
              </CardTitle>
              <CardDescription>
                Use estas informações para configurar a integração
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">URL do Webhook</Label>
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
                <Label className="text-sm font-medium">Método HTTP</Label>
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
              <CardTitle>Exemplo de Requisição</CardTitle>
              <CardDescription>
                Envie uma requisição POST com o seguinte formato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Headers
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
                  Body (JSON)
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
                  Campos do Body
                </Label>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2 p-2 bg-muted/50 rounded font-medium">
                    <span>Campo</span>
                    <span>Tipo</span>
                    <span>Obrigatório</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2">
                    <code>title</code>
                    <span>string</span>
                    <span className="text-green-600">Sim</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2 bg-muted/30">
                    <code>customerPhone</code>
                    <span>string (11 dígitos)</span>
                    <span className="text-green-600">Sim</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2">
                    <code>description</code>
                    <span>string</span>
                    <span className="text-muted-foreground">Não</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2 bg-muted/30">
                    <code>value</code>
                    <span>number</span>
                    <span className="text-muted-foreground">Não</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2">
                    <code>customerName</code>
                    <span>string</span>
                    <span className="text-muted-foreground">Não</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2 bg-muted/30">
                    <code>customerEmail</code>
                    <span>email</span>
                    <span className="text-muted-foreground">Não</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Configuração do Webhook
                </Label>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Pipeline:</span>
                    <span className="font-medium">
                      {pipelines?.find((p) => p.id === selectedPipelineId)
                        ?.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span className="text-muted-foreground">
                      Etapa inicial:
                    </span>
                    <span className="font-medium">
                      {selectedStageId
                        ? stages?.find((s) => s.id === selectedStageId)?.name ||
                          "N/A"
                        : "Primeira etapa da pipeline"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Os deals serão criados automaticamente nesta pipeline e etapa
                  quando o webhook for acionado.
                </p>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Observações Importantes
                </Label>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    O telefone deve ter exatamente 11 dígitos (formato:
                    XX9NNNNNNNN)
                  </li>
                  <li>
                    O campo{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      title
                    </code>{" "}
                    é obrigatório e será o nome do negócio
                  </li>
                  <li>
                    O campo{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      customerPhone
                    </code>{" "}
                    é obrigatório
                  </li>
                  <li>Todos os outros campos são opcionais</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleGoBack}>
              Voltar para lista
            </Button>
            <Button onClick={() => navigate(`/webhooks/${createdWebhook.id}`)}>
              Ver detalhes do webhook
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
          <h1 className="text-3xl font-bold tracking-tight">Novo Webhook</h1>
          <p className="text-muted-foreground">
            Crie um webhook para permitir integrações externas
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Webhook</CardTitle>
            <CardDescription>
              Configure as opções do webhook para criação de deals
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
                <Label htmlFor="pipeline">Pipeline *</Label>
                {isLoadingPipelines ? (
                  <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center text-muted-foreground">
                    Carregando pipelines...
                  </div>
                ) : (
                  <Select
                    value={selectedPipelineId}
                    onValueChange={setSelectedPipelineId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma pipeline" />
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
                  Os deals criados pelo webhook serão adicionados a esta
                  pipeline
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Etapa Inicial</Label>
                {!selectedPipelineId ? (
                  <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center text-muted-foreground">
                    Selecione uma pipeline primeiro
                  </div>
                ) : !stages || stages.length === 0 ? (
                  <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center text-muted-foreground">
                    Carregando etapas...
                  </div>
                ) : (
                  <Select
                    value={selectedStageId}
                    onValueChange={setSelectedStageId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma etapa (opcional)" />
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
                  Opcional: Se não informado, a primeira etapa da pipeline será
                  usada
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
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Webhook"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
