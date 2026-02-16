import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Megaphone,
  Loader2,
  Users,
  Eye,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TagSelector } from "@/components/pipelines/TagSelector";
import { listPipelines } from "@/services/pipeline/listPipelines";
import { listPipelineStages } from "@/services/pipeline/listPipelineStages";
import {
  createMassBroadcast,
  previewRecipients,
} from "@/services/mass-broadcast";
import { CreateMassBroadcastInput } from "@/types/mass-broadcast";
import { PipelineStageMinimal } from "@/types/pipeline";

export default function MassBroadcastCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const workspaceId = currentWorkspace?.id || "";

  // Form state
  const [name, setName] = useState("");
  const [messages, setMessages] = useState<string[]>([""]);
  const [selectedPipelineId, setSelectedPipelineId] = useState("");
  const [includeTagIds, setIncludeTagIds] = useState<string[]>([]);
  const [excludeTagIds, setExcludeTagIds] = useState<string[]>([]);
  const [applyTagIds, setApplyTagIds] = useState<string[]>([]);
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [messageDelaySeconds, setMessageDelaySeconds] = useState(30);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Pipeline stages for selection (all pipelines)
  const [allStages, setAllStages] = useState<
    (PipelineStageMinimal & { pipelineName: string })[]
  >([]);

  // Fetch pipelines
  const { data: pipelines, isLoading: isLoadingPipelines } = useQuery({
    queryKey: ["pipelines", workspaceId],
    queryFn: () => listPipelines(workspaceId),
    enabled: !!workspaceId,
  });

  // Fetch stages for all pipelines (for filter selection)
  useEffect(() => {
    if (!pipelines || !workspaceId) return;

    const fetchAllStages = async () => {
      const stagesPromises = pipelines.map(async (pipeline) => {
        try {
          const stages = await listPipelineStages(pipeline.id, workspaceId);
          return stages.map((stage) => ({
            ...stage,
            pipelineName: pipeline.name,
          }));
        } catch {
          return [];
        }
      });

      const results = await Promise.all(stagesPromises);
      setAllStages(results.flat());
    };

    fetchAllStages();
  }, [pipelines, workspaceId]);

  // Preview recipients
  const previewMutation = useMutation({
    mutationFn: () =>
      previewRecipients({
        workspaceId,
        includeTagIds: includeTagIds.length > 0 ? includeTagIds : undefined,
        excludeTagIds: excludeTagIds.length > 0 ? excludeTagIds : undefined,
        pipelineStageIds:
          selectedStageIds.length > 0 ? selectedStageIds : undefined,
      }),
    onSuccess: (data) => {
      toast({
        title: "Destinatários encontrados",
        description: `${data.total} ${data.total === 1 ? "pessoa receberá" : "pessoas receberão"} esta campanha com os filtros selecionados.`,
      });
    },
    onError: () => {
      toast({
        title: "Erro ao buscar destinatários",
        description:
          "Não foi possível calcular quantas pessoas receberão a campanha. Verifique os filtros.",
        variant: "destructive",
      });
    },
  });

  // Create campaign
  const createMutation = useMutation({
    mutationFn: (data: CreateMassBroadcastInput) => createMassBroadcast(data),
    onSuccess: (broadcast) => {
      toast({
        title: "Campanha criada",
        description: `A campanha "${broadcast.name}" foi criada com ${broadcast.totalRecipients} destinatário(s).`,
      });
      queryClient.invalidateQueries({
        queryKey: ["mass-broadcasts", workspaceId],
      });
      navigate(`/broadcasts/${broadcast.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar campanha",
        description: error?.message || "Ocorreu um erro ao criar a campanha.",
        variant: "destructive",
      });
    },
  });

  // Message helpers
  const addMessage = () => {
    if (messages.length < 20) {
      setMessages([...messages, ""]);
    }
  };

  const removeMessage = (index: number) => {
    if (messages.length > 1) {
      setMessages(messages.filter((_, i) => i !== index));
    }
  };

  const updateMessage = (index: number, value: string) => {
    const updated = [...messages];
    updated[index] = value;
    setMessages(updated);
  };

  // Stage toggle
  const toggleStage = (stageId: string) => {
    setSelectedStageIds((prev) =>
      prev.includes(stageId)
        ? prev.filter((id) => id !== stageId)
        : [...prev, stageId],
    );
  };

  // Validation
  const hasSelectionCriteria =
    includeTagIds.length > 0 || selectedStageIds.length > 0;

  const hasValidMessages = messages.some((m) => m.trim().length > 0);

  const canSubmit =
    name.trim() &&
    selectedPipelineId &&
    hasValidMessages &&
    hasSelectionCriteria;

  const canPreview = hasSelectionCriteria;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      toast({
        title: "Preencha todos os campos obrigatórios",
        description:
          "Nome, funil, pelo menos uma mensagem e critérios de seleção são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const filteredMessages = messages.filter((m) => m.trim().length > 0);

    const input: CreateMassBroadcastInput = {
      name: name.trim(),
      messages: filteredMessages,
      pipelineId: selectedPipelineId,
      workspaceId,
      includeTagIds: includeTagIds.length > 0 ? includeTagIds : undefined,
      excludeTagIds: excludeTagIds.length > 0 ? excludeTagIds : undefined,
      pipelineStageIds:
        selectedStageIds.length > 0 ? selectedStageIds : undefined,
      applyTagIds: applyTagIds.length > 0 ? applyTagIds : undefined,
      messageDelaySeconds,
      startTime: startTime ? new Date(startTime).toISOString() : undefined,
      endTime: endTime ? new Date(endTime).toISOString() : undefined,
    };

    createMutation.mutate(input);
  };

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Selecione um workspace para criar uma campanha
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/broadcasts")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Campanha</h1>
          <p className="text-muted-foreground">
            Configure e crie uma nova campanha de disparo em massa
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
            <CardDescription>
              Defina o nome da campanha e a conexão WhatsApp para envio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Campanha *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Promoção Black Friday 2026"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pipeline">Funil (conexão WhatsApp) *</Label>
              <Select
                value={selectedPipelineId}
                onValueChange={setSelectedPipelineId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funil" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingPipelines ? (
                    <SelectItem value="loading" disabled>
                      Carregando...
                    </SelectItem>
                  ) : (
                    pipelines?.map((pipeline) => (
                      <SelectItem key={pipeline.id} value={pipeline.id}>
                        {pipeline.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                O funil define qual conexão WhatsApp será usada para enviar as
                mensagens
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Mensagens</CardTitle>
            <CardDescription>
              Adicione variações de mensagem. O sistema sorteia aleatoriamente
              uma para cada destinatário, ajudando a evitar detecção de spam.
              Recomendamos pelo menos 3 variações.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Variação {index + 1}</Label>
                  {messages.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeMessage(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  )}
                </div>
                <Textarea
                  value={message}
                  onChange={(e) => updateMessage(index, e.target.value)}
                  placeholder="Digite a mensagem..."
                  rows={3}
                />
              </div>
            ))}
            {messages.length < 20 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMessage}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar variação
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Selection Criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Critérios de Seleção
            </CardTitle>
            <CardDescription>
              Defina quais clientes receberão a mensagem. Pelo menos um critério
              de inclusão é obrigatório. Os filtros são combinados e depois as
              exclusões são aplicadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <TagSelector
                workspaceId={workspaceId}
                selectedTagIds={includeTagIds}
                onSelectionChange={setIncludeTagIds}
                label="Tags de Inclusão"
                placeholder="Selecionar tags..."
                emptyMessage="Nenhuma tag de inclusão selecionada"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Clientes cujo chat tenha pelo menos uma dessas tags serão
                incluídos
              </p>
            </div>

            <Separator />

            <div>
              <TagSelector
                workspaceId={workspaceId}
                selectedTagIds={excludeTagIds}
                onSelectionChange={setExcludeTagIds}
                label="Tags de Exclusão"
                placeholder="Selecionar tags para excluir..."
                emptyMessage="Nenhuma tag de exclusão selecionada"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Clientes cujo chat tenha pelo menos uma dessas tags serão
                removidos da lista
              </p>
            </div>

            <Separator />

            {/* Pipeline Stages */}
            <div className="space-y-2">
              <Label>Etapas de Funil</Label>
              <p className="text-xs text-muted-foreground">
                Clientes com negócios nas etapas selecionadas serão incluídos
              </p>
              {allStages.length > 0 ? (
                <div className="grid gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                  {/* Group stages by pipeline */}
                  {pipelines?.map((pipeline) => {
                    const pipelineStages = allStages.filter(
                      (s) => s.pipelineName === pipeline.name,
                    );
                    if (pipelineStages.length === 0) return null;

                    return (
                      <div key={pipeline.id} className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {pipeline.name}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {pipelineStages.map((stage) => (
                            <Badge
                              key={stage.id}
                              variant={
                                selectedStageIds.includes(stage.id)
                                  ? "default"
                                  : "outline"
                              }
                              className="cursor-pointer transition-colors"
                              style={
                                selectedStageIds.includes(stage.id) &&
                                stage.color
                                  ? {
                                      backgroundColor: stage.color,
                                      color: "#fff",
                                      borderColor: stage.color,
                                    }
                                  : undefined
                              }
                              onClick={() => toggleStage(stage.id)}
                            >
                              {stage.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma etapa disponível
                </p>
              )}
              {selectedStageIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedStageIds.length} etapa(s) selecionada(s)
                </p>
              )}
            </div>

            <Separator />

            {/* Preview */}
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => previewMutation.mutate()}
                disabled={!canPreview || previewMutation.isPending}
              >
                {previewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Ver quantos receberão
              </Button>
              {previewMutation.data && (
                <span className="text-sm font-medium">
                  {previewMutation.data.total} destinatário(s) encontrado(s)
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Post-send tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags Pós-Envio</CardTitle>
            <CardDescription>
              Tags a aplicar automaticamente ao chat do cliente após envio
              bem-sucedido. Útil para rastrear quem recebeu a campanha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TagSelector
              workspaceId={workspaceId}
              selectedTagIds={applyTagIds}
              onSelectionChange={setApplyTagIds}
              label=""
              placeholder="Selecionar tags a aplicar..."
              emptyMessage="Nenhuma tag configurada"
            />
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Envio</CardTitle>
            <CardDescription>
              Configure o intervalo entre mensagens e a janela de envio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delay">
                Intervalo entre mensagens (segundos)
              </Label>
              <Input
                id="delay"
                type="number"
                min={10}
                max={300}
                value={messageDelaySeconds}
                onChange={(e) => setMessageDelaySeconds(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo: 10s • Máximo: 300s (5 min) • Recomendado: 30-60s
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Início da janela de envio</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. Envios só ocorrem após este horário.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Fim da janela de envio</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. Envios param antes deste horário.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/broadcasts")}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Megaphone className="h-4 w-4 mr-2" />
            )}
            Criar Campanha
          </Button>
        </div>
      </form>
    </div>
  );
}
