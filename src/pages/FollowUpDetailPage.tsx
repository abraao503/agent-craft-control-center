import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { minutesToTimeValue } from "@/lib/time-utils";
import { InactiveChatRangePicker } from "@/components/follow-up/InactiveChatRangePicker";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Clock,
  Edit,
  Loader2,
  MessageSquare,
  Save,
  Timer,
  X,
  Send,
  Tag as TagIcon,
} from "lucide-react";
import { QueuedMessagesTable } from "@/components/follow-up/QueuedMessagesTable";
import {
  getFollowUpById,
  listQueuedMessages,
  updateFollowUp,
  updateMessageQueue,
} from "@/services/follow-up";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isColorDark } from "@/lib/utils";
import { listTags } from "@/services/tag/listTags";
import { Tag } from "@/types/tag";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Importação do tipo FollowUp
import { FollowUp } from "@/types/follow-up";

// Componente para configurações da fila
function QueueSettingsCard({ followUp }: { followUp: FollowUp }) {
  const [delaySeconds, setDelaySeconds] = useState<number>(
    followUp.messageQueue.delaySeconds
  );
  const [isActive, setIsActive] = useState<boolean>(
    followUp.messageQueue.isActive
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation para atualizar configurações da fila
  const updateMessageQueueMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { isActive: boolean; delaySeconds: number };
    }) => updateMessageQueue(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followUps", followUp.id] });
      toast({
        title: "Configurações atualizadas",
        description: "As configurações da fila foram atualizadas com sucesso.",
      });
      setIsSaving(false);
    },
    onError: (error) => {
      console.error("Erro ao atualizar configurações da fila:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar as configurações da fila.",
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  // Função para atualizar as configurações da fila
  const updateQueueSettings = () => {
    setIsSaving(true);
    updateMessageQueueMutation.mutate({
      id: followUp.messageQueue.id,
      data: {
        isActive,
        delaySeconds,
      },
    });
  };

  // Função para alternar o status da fila
  const toggleQueueStatus = () => {
    setIsActive(!isActive);
  };

  return (
    <Card className="w-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Timer className="h-5 w-5 mr-2" />
          Configurações da Fila
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        <div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  {isActive ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      Ativa
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Inativa
                    </Badge>
                  )}
                </p>
                <Switch
                  checked={isActive}
                  onCheckedChange={toggleQueueStatus}
                  disabled={isSaving}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isActive
                  ? "A fila está ativa e enviará mensagens automaticamente."
                  : "A fila está desativada e não enviará mensagens."}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="delaySeconds">
              Tempo entre mensagens (segundos)
            </Label>
            <div className="flex gap-2">
              <Input
                id="delaySeconds"
                type="number"
                min="1"
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(parseInt(e.target.value) || 1)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Define o intervalo entre o envio de cada mensagem da fila.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={updateQueueSettings}
          disabled={
            isSaving ||
            (delaySeconds === followUp.messageQueue.delaySeconds &&
              isActive === followUp.messageQueue.isActive)
          }
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar alterações
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function FollowUpDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estado para controle de edição
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedMessages, setEditedMessages] = useState<string[]>([]);
  const [editedMinInactiveChatTime, setEditedMinInactiveChatTime] =
    useState<number>(60);
  const [editedMaxInactiveChatTime, setEditedMaxInactiveChatTime] =
    useState<number>(120);
  const [editedMaxMessages, setEditedMaxMessages] = useState<number>(3);
  const [editedInclusiveTags, setEditedInclusiveTags] = useState<string[]>([]);
  const [editedExclusiveTags, setEditedExclusiveTags] = useState<string[]>([]);
  const [editedResponseTags, setEditedResponseTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Estados para paginação das mensagens enfileiradas
  const [messagesPage, setMessagesPage] = useState(1);
  const [messagesLimit, setMessagesLimit] = useState(20);

  // Query para buscar detalhes do follow-up
  const {
    data: followUpData,
    isLoading: isLoadingFollowUp,
    error: followUpError,
  } = useQuery({
    queryKey: ["followUps", id],
    queryFn: () => getFollowUpById(id || ""),
    enabled: !!id,
  });

  // Query para buscar todas as tags disponíveis
  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["tags", followUpData?.workspaceId],
    queryFn: () => listTags(followUpData?.workspaceId || ""),
    enabled: !!followUpData?.workspaceId,
  });

  // Atualiza os campos de edição quando os dados do follow-up são carregados
  useEffect(() => {
    if (followUpData) {
      setEditedMessages(followUpData.messages || []);
      setEditedMinInactiveChatTime(followUpData.minInactiveChatTime || 60);
      setEditedMaxInactiveChatTime(followUpData.maxInactiveChatTime || 120);
      setEditedMaxMessages(followUpData.maxMessages || 3);
      setEditedInclusiveTags(followUpData.inclusiveTags || []);
      setEditedExclusiveTags(followUpData.exclusiveTags || []);
      setEditedResponseTags(followUpData.responseTags || []);
    }
  }, [followUpData]);

  // Mostrar toast em caso de erro
  useEffect(() => {
    if (followUpError) {
      toast({
        title: "Erro ao carregar follow-up",
        description: "Não foi possível carregar os detalhes do follow-up.",
        variant: "destructive",
      });
      console.error("Error loading follow-up:", followUpError);
    }
  }, [followUpError, toast]);

  // Fetch queued messages - só será executado quando followUp estiver disponível
  const {
    data: queuedMessagesData,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery({
    queryKey: [
      "queuedMessages",
      followUpData?.messageQueue.id,
      messagesPage,
      messagesLimit,
    ],
    queryFn: () => {
      if (!followUpData?.messageQueue.id) {
        throw new Error("Message queue ID not found");
      }
      return listQueuedMessages({
        messageQueueId: followUpData.messageQueue.id,
        page: messagesPage,
        limit: messagesLimit,
      });
    },
    enabled: !!followUpData?.messageQueue.id,
  });

  // Mostrar toast em caso de erro nas mensagens
  useEffect(() => {
    if (messagesError) {
      toast({
        title: "Erro ao carregar mensagens",
        description: "Não foi possível carregar as mensagens de follow-ups.",
        variant: "destructive",
      });
      console.error("Error loading queued messages:", messagesError);
    }
  }, [messagesError, toast]);

  // Mutation para atualizar o follow-up
  const updateFollowUpMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        messages: string[];
        minInactiveChatTime: number;
        maxInactiveChatTime: number;
        maxMessages?: number;
        inclusiveTags?: string[];
        exclusiveTags?: string[];
        responseTags?: string[];
      };
    }) => updateFollowUp(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followUps", id] });
      toast({
        title: "Follow-up atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
      setIsEditing(false);
      setIsSaving(false);
    },
    onError: (error) => {
      console.error("Erro ao atualizar follow-up:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  // Função para entrar no modo de edição
  const handleEditClick = () => {
    if (!followUpData) return;

    setEditedMessages(followUpData.messages || []);
    setEditedMinInactiveChatTime(followUpData.minInactiveChatTime || 60);
    setEditedMaxInactiveChatTime(followUpData.maxInactiveChatTime || 120);
    setEditedMaxMessages(followUpData.maxMessages || 3);
    setEditedInclusiveTags(followUpData.inclusiveTags || []);
    setEditedExclusiveTags(followUpData.exclusiveTags || []);
    setEditedResponseTags(followUpData.responseTags || []);
    setIsEditing(true);
  };

  const handleCloseEdit = () => {
    setIsEditing(false);
  };

  // Função para alterar página das mensagens enfileiradas
  const handleMessagesPageChange = (page: number) => {
    setMessagesPage(page);
  };

  // Função para alterar limite de itens por página
  const handleLimitChange = (limit: string) => {
    setMessagesLimit(parseInt(limit));
    setMessagesPage(1); // Reset to first page when changing limit
  };

  // Função para salvar as alterações
  const handleSaveChanges = () => {
    if (!followUpData) return;

    setIsSaving(true);
    updateFollowUpMutation.mutate({
      id: followUpData.id,
      data: {
        messages: editedMessages,
        minInactiveChatTime: editedMinInactiveChatTime,
        maxInactiveChatTime: editedMaxInactiveChatTime,
        maxMessages: editedMaxMessages,
        inclusiveTags: editedInclusiveTags,
        exclusiveTags: editedExclusiveTags,
        responseTags: editedResponseTags,
      },
    });
  };

  // Only block the entire page while the follow-up details are loading.
  // Messages loading (pagination) is handled inline in the table section.
  const isLoading = isLoadingFollowUp;
  const hasError = followUpError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="space-y-4">
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="bg-red-50 p-4 rounded-md border border-red-200">
          <p className="text-red-800">
            Erro ao carregar dados. Tente novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }

  if (!followUpData) {
    return (
      <div className="space-y-4">
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
          <p className="text-yellow-800">Follow-up não encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button onClick={() => navigate(-1)} variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-0 gap-y-6 lg:gap-6">
        <div className="md:col-span-2 flex">
          <Card className="shadow-sm w-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">{followUpData.name}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={isEditing ? handleCloseEdit : handleEditClick}
              >
                {isEditing ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Edit className="h-4 w-4" />
                )}
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="messages">Mensagens</Label>
                    <div className="space-y-3">
                      {editedMessages.map((message, index) => (
                        <div key={index} className="flex gap-2">
                          <Textarea
                            id={`message-${index}`}
                            value={message}
                            onChange={(e) => {
                              const newMessages = [...editedMessages];
                              newMessages[index] = e.target.value;
                              setEditedMessages(newMessages);
                            }}
                            className="min-h-[100px] flex-grow"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (editedMessages.length > 1) {
                                const newMessages = [...editedMessages];
                                newMessages.splice(index, 1);
                                setEditedMessages(newMessages);
                              }
                            }}
                            disabled={editedMessages.length <= 1}
                            className="h-10 w-10 shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditedMessages([...editedMessages, ""])}
                      className="w-full mt-2"
                    >
                      + Adicionar mensagem
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Configure pelo menos uma mensagem para o follow-up.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inactiveChatTimeRange">
                      Intervalo de tempo de inatividade
                    </Label>
                    <InactiveChatRangePicker
                      minValue={editedMinInactiveChatTime}
                      maxValue={editedMaxInactiveChatTime}
                      onMinChange={setEditedMinInactiveChatTime}
                      onMaxChange={setEditedMaxInactiveChatTime}
                      maxDays={7}
                      minTotalMinutes={60}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxMessages">
                      Número máximo de mensagens
                    </Label>
                    <Input
                      id="maxMessages"
                      type="number"
                      min="1"
                      value={editedMaxMessages}
                      onChange={(e) =>
                        setEditedMaxMessages(parseInt(e.target.value) || 1)
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Número máximo de follow-ups que serão enviados caso o
                      cliente não responda.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-md border border-slate-100 h-full">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">
                      Mensagens configuradas:
                    </h3>
                    {followUpData?.messages &&
                    followUpData.messages.length > 0 ? (
                      followUpData.messages.map((message, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white rounded-md border border-slate-200"
                        >
                          <p className="text-sm leading-relaxed">{message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Mensagem {index + 1}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma mensagem configurada
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-6 pt-6">
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-slate-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Intervalo de tempo de inatividade
                      </p>
                      <p className="text-sm font-medium">
                        {followUpData &&
                          (() => {
                            const minTimeValue = minutesToTimeValue(
                              followUpData.minInactiveChatTime || 60
                            );
                            const maxTimeValue = minutesToTimeValue(
                              followUpData.maxInactiveChatTime || 120
                            );

                            const formatTimeValue = (timeValue: {
                              days: number;
                              hours: number;
                              minutes: number;
                            }) => {
                              const parts: string[] = [];
                              if (timeValue.days > 0) {
                                parts.push(
                                  `${timeValue.days} ${
                                    timeValue.days === 1 ? "dia" : "dias"
                                  }`
                                );
                              }

                              if (timeValue.hours > 0) {
                                parts.push(
                                  `${timeValue.hours} ${
                                    timeValue.hours === 1 ? "hora" : "horas"
                                  }`
                                );
                              }

                              if (timeValue.minutes > 0 || parts.length === 0) {
                                parts.push(
                                  `${timeValue.minutes} ${
                                    timeValue.minutes === 1
                                      ? "minuto"
                                      : "minutos"
                                  }`
                                );
                              }

                              return parts.join(", ");
                            };

                            const minFormatted = formatTimeValue(minTimeValue);
                            const maxFormatted = formatTimeValue(maxTimeValue);

                            return `${minFormatted} - ${maxFormatted}`;
                          })()}
                      </p>
                    </div>
                  </div>

                  {/* Data de criação */}
                  <div className="flex items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Criado em</p>
                      <p className="text-sm font-medium">
                        {followUpData?.createdAt &&
                          format(
                            new Date(followUpData.createdAt),
                            "dd/MM/yyyy HH:mm",
                            {
                              locale: ptBR,
                            }
                          )}
                      </p>
                    </div>
                  </div>

                  {/* Número máximo de mensagens */}
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-slate-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Máximo de mensagens
                      </p>
                      <p className="text-sm font-medium">
                        {followUpData?.maxMessages || 3}
                      </p>
                    </div>
                  </div>

                  {/* Progresso de mensagens enviadas */}
                  <div className="flex items-center">
                    <Send className="h-5 w-5 mr-2 text-slate-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Mensagens enviadas
                      </p>
                      <p className="text-sm font-medium">
                        {followUpData?.totalQueuedMessagesSent || 0}/
                        {followUpData?.totalQueuedMessages || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {!isEditing ? (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <TagIcon className="h-5 w-5 mr-2 text-slate-500" />
                      <p className="text-xs text-muted-foreground">
                        Tags Inclusivas
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {followUpData?.inclusiveTags &&
                      followUpData.inclusiveTags.length > 0 ? (
                        followUpData.inclusiveTags.map((tagId) => {
                          const tag = tags.find((t) => t.id === tagId);
                          return tag ? (
                            <Badge
                              key={tag.id}
                              style={{
                                backgroundColor: tag.color,
                                color: isColorDark(tag.color)
                                  ? "white"
                                  : "black",
                              }}
                            >
                              {tag.name}
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Nenhuma tag inclusiva
                        </p>
                      )}
                    </div>

                    <div className="flex items-center mt-4">
                      <TagIcon className="h-5 w-5 mr-2 text-slate-500" />
                      <p className="text-xs text-muted-foreground">
                        Tags Exclusivas
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {followUpData?.exclusiveTags &&
                      followUpData.exclusiveTags.length > 0 ? (
                        followUpData.exclusiveTags.map((tagId) => {
                          const tag = tags.find((t) => t.id === tagId);
                          return tag ? (
                            <Badge
                              key={tag.id}
                              style={{
                                backgroundColor: tag.color,
                                color: isColorDark(tag.color)
                                  ? "white"
                                  : "black",
                              }}
                              variant="outline"
                            >
                              {tag.name}
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Nenhuma tag exclusiva
                        </p>
                      )}
                    </div>

                    <div className="flex items-center mt-4">
                      <TagIcon className="h-5 w-5 mr-2 text-slate-500" />
                      <p className="text-xs text-muted-foreground">
                        Tags de Resposta
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {followUpData?.responseTags &&
                      followUpData.responseTags.length > 0 ? (
                        followUpData.responseTags.map((tagId) => {
                          const tag = tags.find((t) => t.id === tagId);
                          return tag ? (
                            <Badge
                              key={tag.id}
                              style={{
                                backgroundColor: tag.color,
                                color: isColorDark(tag.color)
                                  ? "white"
                                  : "black",
                              }}
                              variant="outline"
                            >
                              {tag.name}
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Nenhuma tag de resposta
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="inclusiveTags">Tags Inclusivas</Label>
                      <MultiSelect
                        options={tags.map((tag) => ({
                          value: tag.id,
                          label: tag.name,
                          color: tag.color,
                        }))}
                        placeholder="Selecione as tags inclusivas"
                        selected={editedInclusiveTags}
                        onChange={setEditedInclusiveTags}
                        renderOption={(option) => (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: option.color }}
                            />
                            {option.label}
                          </div>
                        )}
                        renderSelection={(selected) => (
                          <div className="flex flex-wrap gap-1">
                            {selected.map((option) => {
                              const tag = tags.find(
                                (t) => t.id === option.value
                              );
                              if (!tag) return null;

                              return (
                                <Badge
                                  key={tag.id}
                                  style={{
                                    backgroundColor: tag.color,
                                    color: isColorDark(tag.color)
                                      ? "white"
                                      : "black",
                                  }}
                                >
                                  {tag.name}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        O follow-up será aplicado apenas a clientes que possuem
                        pelo menos uma das tags selecionadas.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="exclusiveTags">Tags Exclusivas</Label>
                      <MultiSelect
                        options={tags.map((tag) => ({
                          value: tag.id,
                          label: tag.name,
                          color: tag.color,
                        }))}
                        placeholder="Selecione as tags exclusivas"
                        selected={editedExclusiveTags}
                        onChange={setEditedExclusiveTags}
                        renderOption={(option) => (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: option.color }}
                            />
                            {option.label}
                          </div>
                        )}
                        renderSelection={(selected) => (
                          <div className="flex flex-wrap gap-1">
                            {selected.map((option) => {
                              const tag = tags.find(
                                (t) => t.id === option.value
                              );
                              if (!tag) return null;

                              return (
                                <Badge
                                  key={tag.id}
                                  style={{
                                    backgroundColor: tag.color,
                                    color: isColorDark(tag.color)
                                      ? "white"
                                      : "black",
                                  }}
                                >
                                  {tag.name}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        O follow-up NÃO será aplicado a clientes que possuem
                        QUALQUER uma destas tags.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="responseTags">Tags de Resposta</Label>
                      <MultiSelect
                        options={tags.map((tag) => ({
                          value: tag.id,
                          label: tag.name,
                          color: tag.color,
                        }))}
                        placeholder="Selecione as tags de resposta"
                        selected={editedResponseTags}
                        onChange={setEditedResponseTags}
                        renderOption={(option) => (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: option.color }}
                            />
                            {option.label}
                          </div>
                        )}
                        renderSelection={(selected) => (
                          <div className="flex flex-wrap gap-1">
                            {selected.map((option) => {
                              const tag = tags.find(
                                (t) => t.id === option.value
                              );
                              if (!tag) return null;

                              return (
                                <Badge
                                  key={tag.id}
                                  style={{
                                    backgroundColor: tag.color,
                                    color: isColorDark(tag.color)
                                      ? "white"
                                      : "black",
                                  }}
                                >
                                  {tag.name}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Essas tags serão automaticamente atribuídas ao chat
                        quando o follow-up for respondido pelo cliente.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            {isEditing && (
              <CardFooter>
                <Button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar alterações
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        <div className="flex">
          <QueueSettingsCard followUp={followUpData} />
        </div>
      </div>

      {/* Mensagens Enfileiradas */}
      <div>
        <h2 className="text-xl font-bold mb-4">Mensagens aguardando envio</h2>
        <Separator className="mb-4" />

        {messagesError ? (
          <div className="bg-red-50 p-4 rounded-md border border-red-200">
            <p className="text-red-800">
              Erro ao carregar mensagens. Tente novamente mais tarde.
            </p>
          </div>
        ) : (
          <>
            <QueuedMessagesTable
              messages={queuedMessagesData?.items || []}
              isLoading={isLoadingMessages}
              lastPageLength={messagesLimit}
            />

            {/* Seletor de itens por página e Paginação */}
            <div className="flex items-center justify-between mt-4 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Resultados por página:
                </span>
                <Select
                  value={String(messagesLimit)}
                  onValueChange={handleLimitChange}
                  disabled={isLoadingMessages}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="30" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Paginação - sempre visível quando há dados ou durante carregamento */}
              {(queuedMessagesData && queuedMessagesData.totalPages > 1) ||
              isLoadingMessages ? (
                <div className="w-full">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            !isLoadingMessages &&
                            handleMessagesPageChange(
                              Math.max(1, messagesPage - 1)
                            )
                          }
                          className={
                            messagesPage === 1 || isLoadingMessages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {(() => {
                        if (isLoadingMessages) {
                          // Show skeleton pagination during loading
                          return [
                            <PaginationItem key="loading-1">
                              <div className="h-9 w-9 bg-gray-200 rounded animate-pulse"></div>
                            </PaginationItem>,
                            <PaginationItem key="loading-2">
                              <div className="h-9 w-9 bg-gray-200 rounded animate-pulse"></div>
                            </PaginationItem>,
                            <PaginationItem key="loading-3">
                              <div className="h-9 w-9 bg-gray-200 rounded animate-pulse"></div>
                            </PaginationItem>,
                          ];
                        }

                        if (!queuedMessagesData) return [];

                        const totalPages = queuedMessagesData.totalPages;
                        const currentPage = messagesPage;
                        const pages: JSX.Element[] = [];

                        // Always show first page
                        if (totalPages > 0) {
                          pages.push(
                            <PaginationItem key={1}>
                              <PaginationLink
                                onClick={() => handleMessagesPageChange(1)}
                                isActive={currentPage === 1}
                              >
                                1
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }

                        // Add ellipsis after first page if needed
                        if (currentPage > 3) {
                          pages.push(
                            <PaginationItem key="ellipsis-start">
                              <span className="px-2 text-muted-foreground select-none">
                                ...
                              </span>
                            </PaginationItem>
                          );
                        }

                        // Show pages around current page
                        const startPage = Math.max(2, currentPage - 1);
                        const endPage = Math.min(
                          totalPages - 1,
                          currentPage + 1
                        );

                        for (let page = startPage; page <= endPage; page++) {
                          if (page !== 1 && page !== totalPages) {
                            pages.push(
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => handleMessagesPageChange(page)}
                                  isActive={page === currentPage}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                        }

                        // Add ellipsis before last page if needed
                        if (currentPage < totalPages - 2) {
                          pages.push(
                            <PaginationItem key="ellipsis-end">
                              <span className="px-2 text-muted-foreground select-none">
                                ...
                              </span>
                            </PaginationItem>
                          );
                        }

                        // Always show last page (if different from first)
                        if (totalPages > 1) {
                          pages.push(
                            <PaginationItem key={totalPages}>
                              <PaginationLink
                                onClick={() =>
                                  handleMessagesPageChange(totalPages)
                                }
                                isActive={currentPage === totalPages}
                              >
                                {totalPages}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }

                        return pages;
                      })()}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            !isLoadingMessages &&
                            queuedMessagesData &&
                            handleMessagesPageChange(
                              Math.min(
                                queuedMessagesData.totalPages,
                                messagesPage + 1
                              )
                            )
                          }
                          className={
                            (queuedMessagesData &&
                              messagesPage === queuedMessagesData.totalPages) ||
                            isLoadingMessages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              ) : (
                <div></div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
