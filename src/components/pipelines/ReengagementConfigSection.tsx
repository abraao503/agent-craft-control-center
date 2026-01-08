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
import { Trash2, Plus, Settings2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const [draftConfig, setDraftConfig] =
    useState<ReengagementConfigInput | null>(config);

  // Sync draft with prop changes when modal is closed
  useEffect(() => {
    if (!open) {
      setDraftConfig(config);
    }
  }, [config, open]);

  const isEnabled = !!config;

  // Default values
  const defaultConfig: ReengagementConfigInput = {
    minInactiveChatTimeHours: 24,
    maxMessages: 3,
    intervalBetweenMessagesHours: 48,
    messages: [""],
    includeTags: [],
    excludeTags: [],
    isActive: true,
  };

  const handleOpenModal = () => {
    // If not enabled, set default config in draft
    if (!isEnabled) {
      setDraftConfig(defaultConfig);
    }
    setOpen(true);
  };

  const handleDisable = () => {
    setDraftConfig(null);
    onChange(null);
  };

  const handleSave = () => {
    if (draftConfig) {
      // Filter out empty messages before saving
      const cleanedConfig = {
        ...draftConfig,
        messages: draftConfig.messages.filter((m) => m.trim() !== ""),
      };
      // Only save if there's at least one valid message
      if (cleanedConfig.messages.length > 0) {
        onChange(cleanedConfig);
      }
    }
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

  const addMessage = () => {
    if (!draftConfig) return;
    updateDraftConfig({
      messages: [...draftConfig.messages, ""],
    });
  };

  const updateMessage = (index: number, value: string) => {
    if (!draftConfig) return;
    const newMessages = [...draftConfig.messages];
    newMessages[index] = value;
    updateDraftConfig({ messages: newMessages });
  };

  const removeMessage = (index: number) => {
    if (!draftConfig || draftConfig.messages.length <= 1) return;
    const newMessages = draftConfig.messages.filter((_, i) => i !== index);
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

        {/* Max Messages */}
        <div className="space-y-2">
          <Label htmlFor="maxMessages">Máximo de mensagens</Label>
          <Input
            id="maxMessages"
            type="number"
            min={1}
            value={draftConfig.maxMessages}
            onChange={(e) =>
              updateDraftConfig({
                maxMessages: Math.max(1, parseInt(e.target.value) || 1),
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Quantidade máxima de tentativas de reengajamento
          </p>
        </div>

        {/* Interval Between Messages */}
        <div className="space-y-2">
          <Label htmlFor="intervalBetweenMessagesHours">
            Intervalo entre mensagens (horas)
          </Label>
          <Input
            id="intervalBetweenMessagesHours"
            type="number"
            min={1}
            value={draftConfig.intervalBetweenMessagesHours}
            onChange={(e) =>
              updateDraftConfig({
                intervalBetweenMessagesHours: Math.max(
                  1,
                  parseInt(e.target.value) || 1
                ),
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Tempo de espera entre cada mensagem de reengajamento
          </p>
        </div>

        {/* Messages */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Mensagens de Reengajamento</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMessage}
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-3">
            {draftConfig.messages.map((message, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Mensagem {index + 1}
                  </Label>
                  {draftConfig.messages.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMessage(index)}
                      className="h-6 px-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remover
                    </Button>
                  )}
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
            Mensagens serão enviadas em sequência conforme a ordem acima
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
            label="Tags para Incluir"
            placeholder="Adicionar tags"
            emptyMessage="Todos os deals serão incluídos (nenhum filtro)"
          />
          <p className="text-xs text-muted-foreground">
            Se vazio, todos os deals inativos serão considerados. Se preenchido,
            apenas deals com pelo menos uma dessas tags serão reengajados.
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
            label="Tags para Excluir"
            placeholder="Adicionar tags"
            emptyMessage="Nenhum deal será excluído"
          />
          <p className="text-xs text-muted-foreground">
            Deals com qualquer uma dessas tags NÃO receberão mensagens de
            reengajamento.
          </p>
        </div>

        {/* Active Status */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">
              Status da Configuração
            </Label>
            <p className="text-xs text-muted-foreground">
              Ativar ou desativar o reengajamento sem perder as configurações
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
            <Label className="text-sm font-medium">
              Reengajamento Automático
            </Label>
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
                  Ativar Reengajamento
                </>
              )}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configuração de Reengajamento</DialogTitle>
              <DialogDescription>
                Configure mensagens automáticas para deals inativos nesta etapa
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
          <p>• Intervalo: {config.intervalBetweenMessagesHours}h</p>
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
