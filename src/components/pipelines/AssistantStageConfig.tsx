import React, { useEffect, useState } from "react";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import {
  AssistantAllowedTargetStage,
  AssistantPipelineStage,
} from "@/types/pipeline";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";

interface AssistantStageConfigProps {
  stageId: string;
  stageName: string;
  stageOrder: number;
  assistantConfig?: AssistantPipelineStage | null;
  availableStages: Array<{ id: string; name: string; order: number }>;
  focusRuleIndex?: number;
  onConfigChange: (
    stageId: string,
    config?: AssistantPipelineStage | null,
  ) => void;
}

const criteriaOf = (rule: AssistantAllowedTargetStage) =>
  rule.criteria?.length
    ? rule.criteria
    : rule.moveCondition?.trim()
      ? [rule.moveCondition]
      : [];

const sameRule = (
  left: AssistantAllowedTargetStage | null,
  right: AssistantAllowedTargetStage | null,
) => JSON.stringify(left) === JSON.stringify(right);

export const AssistantStageConfig: React.FC<AssistantStageConfigProps> = ({
  stageId,
  stageName,
  stageOrder,
  assistantConfig,
  availableStages,
  focusRuleIndex,
  onConfigChange,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<AssistantAllowedTargetStage | null>(null);
  const [criterion, setCriterion] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [discardPrompt, setDiscardPrompt] = useState<(() => void) | null>(null);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const rules = assistantConfig?.assistantAllowedTargetStages ?? [];
  const targets = availableStages.filter((stage) => stage.order !== stageOrder);

  const makeDraft = (
    rule?: AssistantAllowedTargetStage,
  ): AssistantAllowedTargetStage => ({
    targetStageOrder: rule?.targetStageOrder ?? -1,
    targetStageId: rule?.targetStageId,
    criteria: [...criteriaOf(rule ?? { targetStageOrder: -1 })],
    matchMode: rule?.matchMode ?? "ALL",
    requiresExplicitConfirmation: rule?.requiresExplicitConfirmation ?? false,
  });
  const draftChanged = () =>
    !sameRule(
      draft,
      selectedIndex === null ? null : makeDraft(rules[selectedIndex]),
    );
  const clearEditor = () => {
    setSelectedIndex(null);
    setDraft(null);
    setCriterion("");
    setShowValidation(false);
  };
  const select = (index: number | null) => {
    setSelectedIndex(index);
    setDraft(index === null ? makeDraft() : makeDraft(rules[index]));
    setCriterion("");
    setShowValidation(false);
  };
  const requestChange = (next: () => void) => {
    if (draftChanged()) setDiscardPrompt(() => next);
    else next();
  };
  const save = () => {
    if (!draft || draft.targetStageOrder < 0 || !criteriaOf(draft).length) {
      setShowValidation(true);
      return false;
    }
    const normalized = {
      ...draft,
      criteria: criteriaOf(draft),
      moveCondition: undefined,
    };
    const isNewRule = selectedIndex === null;
    const next =
      isNewRule
        ? [normalized, ...rules]
        : rules.map((rule, index) =>
            index === selectedIndex ? normalized : rule,
          );
    onConfigChange(stageId, { assistantAllowedTargetStages: next });
    if (isNewRule) {
      clearEditor();
    } else {
      setDraft(makeDraft(normalized));
      setShowValidation(false);
    }
    return true;
  };
  const close = () =>
    requestChange(() => {
      setOpen(false);
      clearEditor();
    });
  const targetName = (rule: AssistantAllowedTargetStage) =>
    targets.find((target) => target.order === rule.targetStageOrder)?.name ??
    "Destino não definido";

  useEffect(() => {
    if (
      focusRuleIndex === undefined ||
      focusRuleIndex < 0 ||
      focusRuleIndex >= rules.length
    ) {
      return;
    }

    setOpen(true);
    select(focusRuleIndex);
    setShowValidation(true);
    // Only react when the page asks to focus a different rule.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRuleIndex]);

  return (
    <>
      <div className="mt-3 rounded-md border bg-muted/20 px-2.5 py-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Label className="text-xs font-medium">Automação do agente</Label>
            <p className="text-[11px] leading-snug text-muted-foreground">
              Move negócios automaticamente entre etapas.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              {assistantConfig ? "Ligada" : "Desligada"}
            </span>
            <Switch
              checked={!!assistantConfig}
              aria-label="Ativar automação nesta etapa"
              onCheckedChange={(enabled) =>
                onConfigChange(
                  stageId,
                  enabled ? { assistantAllowedTargetStages: [] } : null,
                )
              }
            />
          </div>
        </div>
        {assistantConfig && (
          <div className="mt-2 border-t border-border/60 pt-2">
            <button
              type="button"
              className="flex h-7 w-full items-center justify-between rounded-sm px-1.5 text-xs font-medium transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                setOpen(true);
                clearEditor();
              }}
            >
              <span>Regras de movimentação</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <span className="text-[11px]">
                  {rules.length === 0
                    ? t("pipelineRules.none")
                    : rules.length === 1
                      ? t("pipelineRules.one", { count: rules.length })
                      : t("pipelineRules.many", { count: rules.length })}
                </span>
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </button>
          </div>
        )}
      </div>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) close();
        }}
      >
        <DialogContent
          className="flex h-[min(760px,90vh)] max-w-5xl flex-col gap-0 overflow-hidden p-0"
          onEscapeKeyDown={(event) => {
            if (draftChanged()) {
              event.preventDefault();
              close();
            }
          }}
          onPointerDownOutside={(event) => {
            if (draftChanged()) {
              event.preventDefault();
              close();
            }
          }}
        >
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Gerenciar regras</DialogTitle>
            <DialogDescription>
              As regras são salvas no rascunho do funil. Use o botão Salvar da
              página para persistir.
            </DialogDescription>
          </DialogHeader>
          <div className="grid min-h-0 flex-1 md:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="min-h-0 overflow-y-auto border-r p-4">
              <Button
                type="button"
                className="mb-3 w-full"
                disabled={selectedIndex === null && draft !== null}
                onClick={() => requestChange(() => select(null))}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova regra
              </Button>
              <div className="space-y-1">
                {selectedIndex === null && draft && (
                  <div className="rounded-md border border-dashed border-primary/50 bg-primary/5 px-3 py-2">
                    <span className="block text-sm font-medium">
                      Nova regra
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Rascunho não salvo
                    </span>
                  </div>
                )}
                {rules.map((rule, index) => (
                  <button
                    key={rule.id ?? `${stageId}-${index}`}
                    type="button"
                    onClick={() => requestChange(() => select(index))}
                    className={`w-full rounded-md px-3 py-2 text-left ${selectedIndex === index ? "bg-accent" : "hover:bg-muted"}`}
                  >
                    <span className="block text-sm font-medium">
                      {targetName(rule)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {criteriaOf(rule).length === 1
                        ? t("pipelineRules.conditionOne", {
                            count: criteriaOf(rule).length,
                          })
                        : t("pipelineRules.conditionMany", {
                            count: criteriaOf(rule).length,
                          })}
                    </span>
                  </button>
                ))}
              </div>
            </aside>
            <section className="min-h-0 overflow-y-auto p-6">
              {!draft ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Selecione ou crie uma regra.
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <Label htmlFor={`${stageId}-target`}>
                      Etapa de destino
                    </Label>
                    <Select
                      value={
                        draft.targetStageOrder >= 0
                          ? String(draft.targetStageOrder)
                          : undefined
                      }
                      onValueChange={(value) => {
                        const target = targets.find(
                          (item) => item.order === Number(value),
                        );
                        setDraft(
                          (current) =>
                            current && {
                              ...current,
                              targetStageOrder: Number(value),
                              targetStageId: target?.id,
                            },
                        );
                      }}
                    >
                      <SelectTrigger
                        id={`${stageId}-target`}
                        className={`mt-1 ${showValidation && draft.targetStageOrder < 0 ? "border-destructive ring-1 ring-destructive" : ""}`}
                      >
                        <SelectValue placeholder="Selecione uma etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {targets.map((target) => (
                          <SelectItem
                            key={target.id}
                            value={String(target.order)}
                          >
                            {target.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {showValidation && draft.targetStageOrder < 0 && (
                      <p className="mt-1 text-xs text-destructive">
                        Selecione a etapa para a qual o negócio será movido.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label>Condições</Label>
                      <p className="text-xs text-muted-foreground">
                        Cada condição é um fato observável na conversa, por
                        exemplo: “Cliente solicitou uma proposta”.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Mover quando
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          (draft.matchMode ?? "ALL") === "ALL"
                            ? "default"
                            : "outline"
                        }
                        aria-pressed={(draft.matchMode ?? "ALL") === "ALL"}
                        onClick={() =>
                          setDraft(
                            (current) =>
                              current && { ...current, matchMode: "ALL" },
                          )
                        }
                      >
                        Todas as condições
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          (draft.matchMode ?? "ALL") === "ANY"
                            ? "default"
                            : "outline"
                        }
                        aria-pressed={(draft.matchMode ?? "ALL") === "ANY"}
                        onClick={() =>
                          setDraft(
                            (current) =>
                              current && { ...current, matchMode: "ANY" },
                          )
                        }
                      >
                        Qualquer condição
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(draft.matchMode ?? "ALL") === "ALL"
                        ? "Todas as condições precisam ser identificadas na conversa."
                        : "Pelo menos uma das condições precisa ser identificada na conversa."}
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={criterion}
                        onChange={(event) => setCriterion(event.target.value)}
                        placeholder="Ex.: Cliente solicitou uma proposta"
                        className={showValidation && !criteriaOf(draft).length ? "border-destructive ring-1 ring-destructive" : ""}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && criterion.trim()) {
                            event.preventDefault();
                            setDraft(
                              (current) =>
                                current && {
                                  ...current,
                                  criteria: [
                                    ...criteriaOf(current),
                                    criterion.trim(),
                                  ],
                                },
                            );
                            setCriterion("");
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (criterion.trim()) {
                            setDraft(
                              (current) =>
                                current && {
                                  ...current,
                                  criteria: [
                                    ...criteriaOf(current),
                                    criterion.trim(),
                                  ],
                                },
                            );
                            setCriterion("");
                          }
                        }}
                      >
                        Adicionar
                      </Button>
                    </div>
                    {criteriaOf(draft).map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                      >
                        <span className="flex-1">{item}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          aria-label="Remover condição"
                          onClick={() =>
                            setDraft(
                              (current) =>
                                current && {
                                  ...current,
                                  criteria: criteriaOf(current).filter(
                                    (_, itemIndex) => itemIndex !== index,
                                  ),
                                },
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {showValidation && !criteriaOf(draft).length && (
                      <p className="text-xs text-destructive">
                        Adicione pelo menos uma condição para salvar a regra.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-3">
                    <div>
                      <Label htmlFor={`${stageId}-confirmation`}>
                        Exigir confirmação explícita
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Só permita a movimentação após uma confirmação clara do
                        cliente.
                      </p>
                    </div>
                    <Switch
                      id={`${stageId}-confirmation`}
                      checked={draft.requiresExplicitConfirmation ?? false}
                      onCheckedChange={(checked) =>
                        setDraft(
                          (current) =>
                            current && {
                              ...current,
                              requiresExplicitConfirmation: checked,
                            },
                        )
                      }
                    />
                  </div>
                  {/* Refinar regra ficará disponível quando o contrato de exceções for ativado. */}
                  <div className="flex justify-between border-t pt-4">
                    <div>
                      {selectedIndex !== null && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setRemoveIndex(selectedIndex)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir regra
                        </Button>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={save}
                    >
                      Salvar regra
                    </Button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!discardPrompt}
        onOpenChange={(value) => !value && setDiscardPrompt(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar alterações da regra?</AlertDialogTitle>
            <AlertDialogDescription>
              Há alterações não salvas nesta regra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDiscardPrompt(null)}>
              Continuar editando
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                const action = discardPrompt;
                setDiscardPrompt(null);
                action?.();
              }}
            >
              Descartar
            </Button>
            <AlertDialogAction
              onClick={() => {
                if (!save()) return;
                const action = discardPrompt;
                setDiscardPrompt(null);
                action?.();
              }}
            >
              Salvar e continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={removeIndex !== null}
        onOpenChange={(value) => !value && setRemoveIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir regra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta regra será removida do rascunho do funil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (removeIndex !== null) {
                  onConfigChange(stageId, {
                    assistantAllowedTargetStages: rules.filter(
                      (_, index) => index !== removeIndex,
                    ),
                  });
                  clearEditor();
                }
                setRemoveIndex(null);
              }}
            >
              Excluir regra
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
