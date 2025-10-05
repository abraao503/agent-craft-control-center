import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PipelineStageMinimal,
  AssistantPipelineStage,
  WhatsAppIntegrationConfig,
} from "@/types/pipeline";
import { Agent } from "@/types/agent";
import { CompanyWhatsAppIntegration } from "@/types/whatsapp";
import {
  WhatsAppIntegrationName,
  WHATSAPP_INTEGRATION_NAMES,
} from "@/types/whatsapp-integration";
import { useQuery } from "@tanstack/react-query";
import { getCompanyWhatsAppIntegration } from "@/services/whatsapp/getCompanyWhatsAppIntegration";
import { cn } from "@/lib/utils";
import { GripVertical, Bot, MessageSquare, Settings, Pencil, Check, X } from "lucide-react";
import { AssistantStageConfig } from "./AssistantStageConfig";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface EditableStage extends PipelineStageMinimal {
  order: number;
  color?: string;
  winProbability?: number;
  assistantPipelineStage?: AssistantPipelineStage;
}

interface PipelineEditorProps {
  pipelineName: string;
  stages: PipelineStageMinimal[];
  availableAgents?: Agent[];
  selectedAssistantId?: string;
  availableWhatsAppIntegrations?: CompanyWhatsAppIntegration[];
  initialWhatsAppConfig?: WhatsAppIntegrationConfig;
  companyWhatsappIntegrationId?: string | null;
  onCancel: () => void;
  onSave: (args: {
    name: string;
    stages: EditableStage[];
    assistantId?: string;
    whatsappIntegration?: WhatsAppIntegrationConfig | null;
  }) => Promise<void> | void;
  saveLabel?: string;
}

interface SortableStageProps {
  stage: EditableStage;
  index: number;
  onUpdate: (index: number, patch: Partial<EditableStage>) => void;
  onRemove: (index: number) => void;
  assistantEnabled: boolean;
  assistantId?: string;
  allStages: EditableStage[];
}

const SortableStage: React.FC<SortableStageProps> = ({
  stage,
  index,
  onUpdate,
  onRemove,
  assistantEnabled,
  assistantId,
  allStages,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(stage.name);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSaveName = () => {
    if (editedName.trim()) {
      onUpdate(index, { name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditedName(stage.name);
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("min-w-[320px] w-[320px] max-w-[360px]")}
    >
      <Card className="flex flex-col bg-background/60 border-border h-[calc(100vh-350px)]">
        <CardHeader
          className="py-3 bg-muted/40 rounded-t-xl border-b border-border"
        >
          <CardTitle className="text-sm flex items-center justify-between gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-7 text-sm"
                  autoFocus
                  onBlur={handleSaveName}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={handleSaveName}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={handleCancelEdit}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 group">
                <span className="flex-1">{stage.name || "(Sem nome)"}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setIsEditingName(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div
              className="cursor-grab active:cursor-grabbing select-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex-1 overflow-auto">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={stage.name}
                onChange={(e) => onUpdate(index, { name: e.target.value })}
              />
            </div>
          </div>

          {assistantEnabled && assistantId && (
            <AssistantStageConfig
              stageId={stage.id}
              stageName={stage.name}
              stageOrder={stage.order}
              assistantConfig={stage.assistantPipelineStage}
              availableStages={allStages.map((s) => ({
                id: s.id,
                name: s.name,
                order: s.order,
              }))}
              onConfigChange={(stageId, config) => {
                onUpdate(index, { assistantPipelineStage: config });
              }}
            />
          )}
        </CardContent>
        <CardFooter className="mt-auto flex items-center justify-between">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="text-sm text-destructive hover:underline"
              onClick={() => onRemove(index)}
            >
              Excluir etapa
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export const PipelineEditor: React.FC<PipelineEditorProps> = ({
  pipelineName,
  stages,
  availableAgents = [],
  selectedAssistantId,
  availableWhatsAppIntegrations = [],
  initialWhatsAppConfig,
  companyWhatsappIntegrationId,
  onCancel,
  onSave,
  saveLabel = "Salvar alterações",
}) => {
  const normalize = (arr: PipelineStageMinimal[]): EditableStage[] =>
    arr.map((s, idx) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      winProbability: s.winProbability ?? 0,
      order: idx,
      assistantPipelineStage: s.assistantPipelineStage,
    }));

  const [name, setName] = useState(pipelineName);
  const [draftStages, setDraftStages] = useState<EditableStage[]>(() =>
    normalize(stages)
  );
  const [useAssistant, setUseAssistant] = useState(() => {
    // Check if pipeline has an assistant configured
    return !!selectedAssistantId;
  });
  const [assistantId, setAssistantId] = useState(() => {
    // Use the assistant ID from pipeline
    return selectedAssistantId || "";
  });
  const [useWhatsApp, setUseWhatsApp] = useState(false);
  const [whatsAppIntegrationId, setWhatsAppIntegrationId] = useState("");
  const [whatsAppIntegrationName, setWhatsAppIntegrationName] =
    useState<WhatsAppIntegrationName>(WHATSAPP_INTEGRATION_NAMES.EVOLUX);
  const [initialStageOrder, setInitialStageOrder] = useState(0);
  const [externalToken, setExternalToken] = useState("");
  const [externalClientToken, setExternalClientToken] = useState("");
  const [postbackUrl, setPostbackUrl] = useState("");
  const [assistantModalOpen, setAssistantModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

  const whatsappIntegrationQuery = useQuery({
    queryKey: ["getCompanyWhatsAppIntegration", companyWhatsappIntegrationId],
    queryFn: () => getCompanyWhatsAppIntegration(companyWhatsappIntegrationId!),
    enabled: !!companyWhatsappIntegrationId,
  });

  useEffect(() => {
    if (whatsappIntegrationQuery.data) {
      const data = whatsappIntegrationQuery.data;
      setUseWhatsApp(true);
      setWhatsAppIntegrationName(data.whatsappIntegrationName);
      setExternalToken(data.externalToken || "");
      setExternalClientToken(data.externalClientToken || "");
      setPostbackUrl(data.postbackUrl || "");

      // Find stage order by initialPipelineStageId
      const stageIndex = draftStages.findIndex(
        (s) => s.id === data.initialPipelineStageId
      );
      if (stageIndex !== -1) {
        setInitialStageOrder(draftStages[stageIndex].order);
      }
    }
  }, [whatsappIntegrationQuery.data, draftStages]);
  const initialRef = useRef<{ name: string; stages: EditableStage[] }>({
    name: pipelineName,
    stages: normalize(stages),
  });
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setDraftStages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((s, i) => ({ ...s, order: i }));
      });
    }
  };

  const setStage = (index: number, patch: Partial<EditableStage>) => {
    setDraftStages((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  };

  const handleRemove = (index: number) => {
    setDraftStages((prev) =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i }))
    );
  };

  const handleAdd = () => {
    setDraftStages((prev) => {
      const next: EditableStage = {
        id: `tmp-${Date.now()}`,
        name: "Nova etapa",
        color: "#64748b",
        winProbability: 100,
        order: prev.length,
      };
      return [...prev, next];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let whatsappIntegration: WhatsAppIntegrationConfig | null | undefined;

      if (useWhatsApp) {
        whatsappIntegration = {
          whatsappIntegrationName: whatsAppIntegrationName,
          initialPipelineStageOrder: initialStageOrder,
        };

        if (whatsAppIntegrationName === WHATSAPP_INTEGRATION_NAMES.ZAPI) {
          whatsappIntegration.externalToken = externalToken;
          whatsappIntegration.externalClientToken = externalClientToken;
          whatsappIntegration.postbackUrl = postbackUrl;
        }
      } else if (companyWhatsappIntegrationId) {
        // If WhatsApp was previously configured but now disabled, send null to remove it
        whatsappIntegration = null;
      }

      await onSave({
        name: name.trim(),
        stages: draftStages.map((s, i) => ({ ...s, order: i })),
        assistantId: useAssistant ? assistantId : undefined,
        whatsappIntegration,
      });
    } finally {
      setSaving(false);
    }
  };

  const isDirty = useMemo(() => {
    const initial = initialRef.current;
    if (name.trim() !== (initial.name || "")) return true;
    if (draftStages.length !== initial.stages.length) return true;
    for (let i = 0; i < draftStages.length; i++) {
      const a = draftStages[i];
      const b = initial.stages[i];
      if (
        a.name !== b.name ||
        (a.color || "") !== (b.color || "") ||
        (a.winProbability || 0) !== (b.winProbability || 0) ||
        a.order !== b.order
      )
        return true;
    }
    return false;
  }, [name, draftStages]);

  const handleCancel = () => {
    if (isDirty) {
      setConfirmOpen(true);
      return;
    }
    onCancel();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-full max-w-md space-y-2">
          <Label>Nome do funil</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Funil Comercial"
          />
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : saveLabel}
          </Button>
        </div>
      </div>

      {/* Compact Configuration Buttons */}
      <div className="flex gap-2">
        {/* Assistant Configuration */}
        <Dialog open={assistantModalOpen} onOpenChange={setAssistantModalOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Bot className="h-4 w-4" />
              <span>Agente</span>
              {useAssistant && assistantId && (
                <span className="text-xs text-muted-foreground">
                  • {availableAgents.find((a) => a.id === assistantId)?.name}
                </span>
              )}
              <Settings className="h-3 w-3 ml-1 text-muted-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configuração de Agente</DialogTitle>
              <DialogDescription>
                Configure um agente para automatizar ações neste funil
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label>Usar Agente</Label>
                <Switch
                  checked={useAssistant}
                  onCheckedChange={(checked) => {
                    setUseAssistant(checked);
                    if (!checked) {
                      setAssistantId("");
                      setDraftStages((prev) =>
                        prev.map((stage) => ({
                          ...stage,
                          assistantPipelineStage: undefined,
                        }))
                      );
                    }
                  }}
                />
              </div>

              {useAssistant && (
                <>
                  <div className="space-y-2">
                    <Label>Selecionar Agente</Label>
                    <Select value={assistantId} onValueChange={setAssistantId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um agente" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAgents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {assistantId && (
                    <p className="text-sm text-muted-foreground">
                      Configure nas etapas abaixo onde o agente pode agir e para
                      onde pode mover os negócios.
                    </p>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setAssistantModalOpen(false)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* WhatsApp Integration */}
        <Dialog open={whatsappModalOpen} onOpenChange={setWhatsappModalOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span>WhatsApp</span>
              {useWhatsApp && (
                <span className="text-xs text-muted-foreground">
                  • {whatsAppIntegrationName}
                </span>
              )}
              <Settings className="h-3 w-3 ml-1 text-muted-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Integração WhatsApp</DialogTitle>
              <DialogDescription>
                Conecte este funil a uma integração WhatsApp para receber leads
                automaticamente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label>Usar WhatsApp</Label>
                <Switch
                  checked={useWhatsApp}
                  onCheckedChange={(checked) => {
                    setUseWhatsApp(checked);
                    if (!checked) {
                      setWhatsAppIntegrationId("");
                      setExternalToken("");
                      setExternalClientToken("");
                      setPostbackUrl("");
                    }
                  }}
                />
              </div>

              {useWhatsApp && (
                <>
                  <div className="space-y-2">
                    <Label>Tipo de Integração</Label>
                    <Select
                      value={whatsAppIntegrationName}
                      onValueChange={(value) =>
                        setWhatsAppIntegrationName(
                          value as WhatsAppIntegrationName
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={WHATSAPP_INTEGRATION_NAMES.EVOLUX}>
                          Evolux
                        </SelectItem>
                        <SelectItem value={WHATSAPP_INTEGRATION_NAMES.ZAPI}>
                          Z-API
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Etapa Inicial</Label>
                    <Select
                      value={initialStageOrder.toString()}
                      onValueChange={(value) =>
                        setInitialStageOrder(parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha a etapa inicial" />
                      </SelectTrigger>
                      <SelectContent>
                        {draftStages.map((stage) => (
                          <SelectItem
                            key={stage.id}
                            value={stage.order.toString()}
                          >
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Novos leads do WhatsApp serão adicionados nesta etapa
                    </p>
                  </div>

                  {whatsAppIntegrationName ===
                    WHATSAPP_INTEGRATION_NAMES.ZAPI && (
                    <>
                      <div className="space-y-2">
                        <Label>External Token</Label>
                        <Input
                          value={externalToken}
                          onChange={(e) => setExternalToken(e.target.value)}
                          placeholder="Digite o token externo"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>External Client Token</Label>
                        <Input
                          value={externalClientToken}
                          onChange={(e) =>
                            setExternalClientToken(e.target.value)
                          }
                          placeholder="Digite o token do cliente"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Postback URL</Label>
                        <Input
                          value={postbackUrl}
                          onChange={(e) => setPostbackUrl(e.target.value)}
                          placeholder="Digite a URL de postback"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setWhatsappModalOpen(false)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex items-start gap-4 h-[calc(100vh-320px)] w-max pr-2">
            <SortableContext
              items={draftStages.map((stage) => stage.id)}
              strategy={horizontalListSortingStrategy}
            >
              {draftStages.map((stage, index) => (
                <SortableStage
                  key={stage.id}
                  stage={stage}
                  index={index}
                  onUpdate={setStage}
                  onRemove={handleRemove}
                  assistantEnabled={useAssistant && !!assistantId}
                  assistantId={assistantId}
                  allStages={draftStages}
                />
              ))}
            </SortableContext>
            {/* Add stage panel */}
            <div className="min-w-[220px] w-[220px]">
              <div className="h-full flex items-start pt-3">
                <button
                  type="button"
                  onClick={handleAdd}
                  className="border rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  + Nova etapa
                </button>
              </div>
            </div>
          </div>
        </DndContext>
      </div>

      {/* Unsaved changes confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Há alterações não salvas. Se você continuar, suas mudanças serão
              perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={onCancel}>Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PipelineEditor;
