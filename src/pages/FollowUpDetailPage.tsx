import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { isColorDark } from "@/lib/utils";
import { listTags } from "@/services/tag/listTags";
import { Tag } from "@/types/tag";

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
      queryClient.invalidateQueries({ queryKey: ["followUp", followUp.id] });
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
  const [editedMessage, setEditedMessage] = useState<string>("");
  const [editedInactiveChatTime, setEditedInactiveChatTime] =
    useState<number>(60);
  const [editedInclusiveTags, setEditedInclusiveTags] = useState<string[]>([]);
  const [editedExclusiveTags, setEditedExclusiveTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Query para buscar detalhes do follow-up
  const {
    data: followUpData,
    isLoading: isLoadingFollowUp,
    error: followUpError,
  } = useQuery({
    queryKey: ["followUp", id],
    queryFn: () => getFollowUpById(id),
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
      setEditedMessage(followUpData.message);
      setEditedInactiveChatTime(followUpData.inactiveChatTime);
      setEditedInclusiveTags(followUpData.inclusiveTags || []);
      setEditedExclusiveTags(followUpData.exclusiveTags || []);
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
    queryKey: ["queuedMessages", followUpData?.messageQueue.id],
    queryFn: async () => {
      if (!followUpData?.messageQueue.id) {
        throw new Error("MessageQueueId não disponível");
      }
      return listQueuedMessages({
        messageQueueId: followUpData?.messageQueue.id,
        page: 1,
        limit: 50,
      });
    },
    enabled: !!followUpData,
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
        message: string;
        inactiveChatTime: number;
        inclusiveTags?: string[];
        exclusiveTags?: string[];
      };
    }) => updateFollowUp(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followUp", id] });
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

    setEditedMessage(followUpData.message);
    setEditedInactiveChatTime(followUpData.inactiveChatTime);
    setEditedInclusiveTags(followUpData.inclusiveTags || []);
    setEditedExclusiveTags(followUpData.exclusiveTags || []);
    setIsEditing(true);
  };

  // Função para salvar as alterações
  const handleSaveChanges = () => {
    if (!followUpData) return;

    setIsSaving(true);
    updateFollowUpMutation.mutate({
      id: followUpData.id,
      data: {
        message: editedMessage,
        inactiveChatTime: editedInactiveChatTime,
        inclusiveTags: editedInclusiveTags,
        exclusiveTags: editedExclusiveTags,
      },
    });
  };

  const isLoading = isLoadingFollowUp || isLoadingMessages;
  const hasError = followUpError || messagesError;

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Detalhes do Follow-up - Versão simplificada */}
        <div className="md:col-span-2 flex">
          <Card className="shadow-sm w-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">{followUpData.name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleEditClick}>
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
                    <Label htmlFor="message">Mensagem</Label>
                    <Textarea
                      id="message"
                      value={editedMessage}
                      onChange={(e) => setEditedMessage(e.target.value)}
                      className="min-h-[150px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inactiveChatTime">
                      Tempo de inatividade (minutos)
                    </Label>
                    <Input
                      id="inactiveChatTime"
                      type="number"
                      min="1"
                      value={editedInactiveChatTime}
                      onChange={(e) =>
                        setEditedInactiveChatTime(parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-md border border-slate-100 h-full">
                  <p className="text-sm leading-relaxed">
                    {followUpData?.message}
                  </p>
                </div>
              )}

              <div className="space-y-6 pt-6">
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-slate-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Tempo de inatividade
                      </p>
                      <p className="text-sm font-medium">
                        {followUpData?.inactiveChatTime}{" "}
                        {followUpData?.inactiveChatTime === 1
                          ? "minuto"
                          : "minutos"}
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

        {/* Card lateral com informações da fila */}
        <div className="flex">
          <QueueSettingsCard followUp={followUpData} />
        </div>
      </div>

      {/* Mensagens Enfileiradas */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Mensagens aguardando envio</h2>
        <Separator />

        {isLoadingMessages ? (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">Carregando mensagens...</p>
          </div>
        ) : messagesError ? (
          <div className="bg-red-50 p-4 rounded-md border border-red-200">
            <p className="text-red-800">
              Erro ao carregar mensagens. Tente novamente mais tarde.
            </p>
          </div>
        ) : (
          <QueuedMessagesTable messages={queuedMessagesData?.items || []} />
        )}
      </div>
    </div>
  );
}
