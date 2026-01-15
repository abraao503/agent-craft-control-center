import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TagSelector } from "./TagSelector";
import { ReengagementConfigInput } from "@/types/pipeline";
import { Plus, Settings2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Helper function to convert time string (HH:MM) to ISO datetime
const timeToISO = (timeString: string): string => {
  const now = new Date();
  const [hours, minutes] = timeString.split(":").map(Number);
  now.setHours(hours, minutes, 0, 0);
  return now.toISOString();
};

// Helper function to extract time (HH:MM) from ISO datetime
const isoToTime = (isoString: string): string => {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

interface ReengagementConfigSectionProps {
  workspaceId: string;
  config: ReengagementConfigInput | null;
  onChange: (config: ReengagementConfigInput | null) => void;
  className?: string;
}

export function ReengagementConfigSection({
  workspaceId,
  config,
  onChange,
  className,
}: ReengagementConfigSectionProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [draftConfig, setDraftConfig] =
    useState<ReengagementConfigInput | null>(config);
  const [maxMessagesInput, setMaxMessagesInput] = useState<string>("");
  const [startTimeInput, setStartTimeInput] = useState<string>("08:00");
  const [endTimeInput, setEndTimeInput] = useState<string>("17:00");

  // Sync draft with prop changes (sempre que config muda)
  useEffect(() => {
    setDraftConfig(config);

    // Extract time from ISO if config exists
    if (config?.startTime) {
      setStartTimeInput(isoToTime(config.startTime));
    } else {
      setStartTimeInput("08:00");
    }

    if (config?.endTime) {
      setEndTimeInput(isoToTime(config.endTime));
    } else {
      setEndTimeInput("17:00");
    }
  }, [config]);

  // Sync maxMessagesInput with draftConfig when modal opens or config changes
  useEffect(() => {
    if (draftConfig) {
      setMaxMessagesInput(draftConfig.maxMessages.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftConfig?.maxMessages]);

  const isEnabled = !!config;

  // Default values
  const defaultConfig: ReengagementConfigInput = {
    minInactiveChatTimeHours: 24,
    maxMessages: 3,
    messages: [""],
    includeTags: [],
    excludeTags: [],
    isActive: true,
    startTime: timeToISO("08:00"),
    endTime: timeToISO("17:00"),
  };

  const handleOpenModal = () => {
    // If not enabled, set default config in draft
    if (!isEnabled) {
      setDraftConfig(defaultConfig);
      setStartTimeInput("08:00");
      setEndTimeInput("17:00");
    }
    // Se já tem config, os valores já foram sincronizados pelo useEffect
    setOpen(true);
  };

  const handleDisable = () => {
    setDraftConfig(null);
    onChange(null);
  };

  const handleSave = () => {
    if (!draftConfig) return;

    // Validação: verificar se todas as mensagens estão preenchidas
    const emptyMessages = draftConfig.messages.filter(
      (m) => m.trim() === ""
    ).length;

    if (emptyMessages > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Por favor, preencha todas as ${draftConfig.maxMessages} mensagens configuradas.`,
        variant: "destructive",
      });
      return;
    }

    // Validação: verificar se o número de mensagens corresponde ao máximo
    if (draftConfig.messages.length !== draftConfig.maxMessages) {
      toast({
        title: "Configuração inválida",
        description: `O número de mensagens (${draftConfig.messages.length}) não corresponde ao máximo configurado (${draftConfig.maxMessages}).`,
        variant: "destructive",
      });
      return;
    }

    // Validação: verificar horários de funcionamento
    const [startHour, startMin] = startTimeInput.split(":").map(Number);
    const [endHour, endMin] = endTimeInput.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      toast({
        title: "Horário inválido",
        description:
          "O horário de término deve ser maior que o horário de início.",
        variant: "destructive",
      });
      return;
    }

    // Converter horários para ISO antes de salvar
    const configToSave: ReengagementConfigInput = {
      ...draftConfig,
      startTime: timeToISO(startTimeInput),
      endTime: timeToISO(endTimeInput),
    };

    // Se passou todas as validações, salvar
    onChange(configToSave);
    setOpen(false);
  };

  const handleCancel = () => {
    setDraftConfig(config);
    setOpen(false);
  };

  const updateDraftConfig = (updates: Partial<ReengagementConfigInput>) => {
    if (!draftConfig) return;
    setDraftConfig({ ...draftConfig, ...updates });
  };

  const updateMessage = (index: number, value: string) => {
    if (!draftConfig) return;
    const newMessages = [...draftConfig.messages];
    newMessages[index] = value;
    updateDraftConfig({ messages: newMessages });
  };

  // Render the configuration modal content
  const renderModalContent = () => {
    if (!draftConfig) return null;

    return (
      <div className="space-y-4 py-4">
        {/* Inactive Time */}
        <div className="space-y-2">
          <Label htmlFor="minInactiveChatTimeHours">
            Tempo de inatividade (horas)
          </Label>
          <Input
            id="minInactiveChatTimeHours"
            type="number"
            min={1}
            value={draftConfig.minInactiveChatTimeHours}
            onChange={(e) =>
              updateDraftConfig({
                minInactiveChatTimeHours: Math.max(
                  1,
                  parseInt(e.target.value) || 1
                ),
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Quanto tempo o chat precisa estar inativo antes de enviar a primeira
            mensagem
          </p>
        </div>

        {/* Operating Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Início do expediente</Label>
            <Input
              id="startTime"
              type="time"
              value={startTimeInput}
              onChange={(e) => setStartTimeInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Horário de início</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">Fim do expediente</Label>
            <Input
              id="endTime"
              type="time"
              value={endTimeInput}
              onChange={(e) => setEndTimeInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Horário de término</p>
          </div>
        </div>

        {/* Max Messages */}
        <div className="space-y-2">
          <Label htmlFor="maxMessages">Máximo de mensagens</Label>
          <Input
            id="maxMessages"
            type="number"
            min={1}
            max={10}
            value={maxMessagesInput}
            onChange={(e) => {
              const inputValue = e.target.value;
              setMaxMessagesInput(inputValue);

              // Allow empty field temporarily
              if (inputValue === "") {
                return;
              }

              const value = parseInt(inputValue);
              if (isNaN(value)) return;

              const newMax = Math.min(10, Math.max(1, value));
              const currentMessages = draftConfig.messages;

              // Adjust messages array to match the new max
              let newMessages = [...currentMessages];
              if (newMax > currentMessages.length) {
                // Add empty messages to reach the max
                newMessages = [
                  ...currentMessages,
                  ...Array(newMax - currentMessages.length).fill(""),
                ];
              } else if (newMax < currentMessages.length) {
                // Remove excess messages
                newMessages = currentMessages.slice(0, newMax);
              }

              updateDraftConfig({
                maxMessages: newMax,
                messages: newMessages,
              });
            }}
            onBlur={() => {
              // If empty on blur, set to 1
              if (maxMessagesInput === "") {
                setMaxMessagesInput("1");
                updateDraftConfig({
                  maxMessages: 1,
                  messages: [""],
                });
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            Quantidade de mensagens que serão enviadas (máximo 10). Configure
            exatamente {draftConfig.maxMessages} mensagem(ns) abaixo.
          </p>
        </div>

        {/* Messages */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              Mensagens de Follow-up ({draftConfig.messages.length}/
              {draftConfig.maxMessages})
            </Label>
          </div>

          <div className="space-y-3">
            {draftConfig.messages.map((message, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Mensagem {index + 1}
                  </Label>
                </div>
                <Textarea
                  value={message}
                  onChange={(e) => updateMessage(index, e.target.value)}
                  placeholder={`Digite a mensagem ${index + 1}...`}
                  className="min-h-[80px] resize-none"
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            As mensagens serão enviadas de forma aleatória a cada tentativa de
            follow-up
          </p>
        </div>

        {/* Include Tags */}
        <div className="space-y-2">
          <TagSelector
            workspaceId={workspaceId}
            selectedTagIds={draftConfig.includeTags || []}
            onSelectionChange={(tagIds) =>
              updateDraftConfig({ includeTags: tagIds })
            }
            label="Tags enviar mensagens"
            placeholder="Adicionar tags"
            emptyMessage="Todos os negócios serão incluídos (nenhum filtro)"
          />
          <p className="text-xs text-muted-foreground">
            Se vazio, todos os negócios inativos serão considerados. Se
            preenchido, apenas negócios com pelo menos uma dessas tags serão
            incluídos.
          </p>
        </div>

        {/* Exclude Tags */}
        <div className="space-y-2">
          <TagSelector
            workspaceId={workspaceId}
            selectedTagIds={draftConfig.excludeTags || []}
            onSelectionChange={(tagIds) =>
              updateDraftConfig({ excludeTags: tagIds })
            }
            label="Tags bloquear mensagens"
            placeholder="Adicionar tags"
            emptyMessage="Nenhum negócio será excluído"
          />
          <p className="text-xs text-muted-foreground">
            negócios com qualquer uma dessas tags NÃO receberão mensagens de
            follow-up.
          </p>
        </div>

        {/* Active Status */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">
              Status da Configuração
            </Label>
            <p className="text-xs text-muted-foreground">
              Ativar ou desativar o follow-up sem perder as configurações
            </p>
          </div>
          <Switch
            checked={draftConfig.isActive ?? true}
            onCheckedChange={(checked) =>
              updateDraftConfig({ isActive: checked })
            }
          />
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Status Display */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Follow-up Automático</Label>
            {isEnabled && (
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-700 border-green-200"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configurado
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isEnabled ? "Ativo" : "Desativado"}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenModal}
              className={cn(!isEnabled && "w-full")}
            >
              {isEnabled ? (
                <>
                  <Settings2 className="h-4 w-4 mr-2" />
                  Configurar
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Ativar Follow-up
                </>
              )}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configuração de Follow-up</DialogTitle>
              <DialogDescription>
                Configure mensagens automáticas para negócios inativos nesta
                etapa
              </DialogDescription>
            </DialogHeader>

            {renderModalContent()}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSave}>
                Salvar Configurações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isEnabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDisable}
            className="text-destructive hover:text-destructive"
          >
            Desativar
          </Button>
        )}
      </div>

      {/* Summary when configured */}
      {isEnabled && config && (
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>• {config.minInactiveChatTimeHours}h de inatividade</p>
          <p>• {config.maxMessages} mensagem(ns) máxima(s)</p>
          {config.startTime && config.endTime && (
            <p>
              • Horário: {isoToTime(config.startTime)} às{" "}
              {isoToTime(config.endTime)}
            </p>
          )}
          {config.includeTags && config.includeTags.length > 0 && (
            <p>• {config.includeTags.length} tag(s) para incluir</p>
          )}
          {config.excludeTags && config.excludeTags.length > 0 && (
            <p>• {config.excludeTags.length} tag(s) para excluir</p>
          )}
        </div>
      )}
    </div>
  );
}
