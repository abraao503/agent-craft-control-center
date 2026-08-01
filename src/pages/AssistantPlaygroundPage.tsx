import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bug, PanelLeft, Plus, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { listPipelines } from "@/services/pipeline/listPipelines";
import { listPipelineStages } from "@/services/pipeline/listPipelineStages";
import { PipelineStageMinimal } from "@/types/pipeline";
import {
  PlaygroundConfiguration,
  PlaygroundDiagnostic,
  PlaygroundRecord,
  PlaygroundScenario,
  PlaygroundSession,
  PlaygroundTurnResult,
} from "@/types/assistant-playground";
import {
  createPlaygroundSession,
  getPlaygroundSession,
  resetPlaygroundSession,
  sendPlaygroundMessage,
  updatePlaygroundScenario,
} from "@/services/agent/playground";

export type PlaygroundLaunchState = {
  configuration: PlaygroundConfiguration;
  notice?: string;
};

type AssistantPlaygroundPageProps = {
  assistantId?: string;
  configuration?: PlaygroundConfiguration;
  embedded?: boolean;
  workspaceId?: string;
  pipeline?: PlaygroundPipelineContext;
};

export type PlaygroundPipelineContext = {
  id?: string;
  name: string;
  stages: PipelineStageMinimal[];
};

const initialScenario: PlaygroundScenario = {
  customer: { name: "Cliente de teste" },
  deal: { title: "Deal de teste" },
  pipeline: { name: "Pipeline de teste" },
  stage: { name: "Qualificação", requiredFields: [], allowedTargetStages: [] },
  fields: {},
  requiredFields: [],
  followUps: [],
  followUpsEnabled: true,
  calendar: { active: false, events: [], availability: [] },
};

const json = (value: unknown) => JSON.stringify(value ?? {}, null, 2);
const errorStatus = (error: unknown) =>
  (error as { response?: { status?: number; data?: { message?: string } } }).response;
const toolLabel = (name: string) => {
  if (name === "moveDealToStage") return "Movimentação de etapas";
  if (name === "storeCustomerName" || name === "storeCustomerEmail") return "Dados do cliente";
  if (name === "fillStageFormField") return "Informações da etapa";
  if (name.startsWith("storeCustomField")) return "Informações do cliente";
  if (name.startsWith("getCustomField")) return "Consulta de informações do cliente";
  if (name === "getCustomerName" || name === "getCustomerEmail") return "Consulta de dados do cliente";
  if (name === "createFollowUp") return "Retornos";
  if (name === "checkCalendarAvailability") return "Consulta de agenda";
  if (name === "createCalendarEvent" || name === "cancelCalendarEvent") return "Agenda";
  return "Recurso configurado";
};
const toolCallSummary = (call: PlaygroundDiagnostic["toolCalls"][number]) => {
  const result = call.result as { success?: boolean; stage?: { name?: string } };
  if (result.success === false) return "O agente não conseguiu concluir uma ação.";
  if (call.name === "moveDealToStage") return result.stage?.name ? `Moveu o negócio para ${result.stage.name}` : "Moveu o negócio para outra etapa";
  if (call.name === "storeCustomerName") return "Registrou o nome do cliente";
  if (call.name === "storeCustomerEmail") return "Registrou o e-mail do cliente";
  if (call.name === "fillStageFormField") return "Registrou uma informação da etapa";
  if (call.name.startsWith("storeCustomField")) return "Registrou uma informação do cliente";
  if (call.name === "createFollowUp") return "Agendou um retorno";
  if (call.name === "createCalendarEvent") return "Criou um evento na agenda";
  if (call.name === "cancelCalendarEvent") return "Cancelou um evento da agenda";
  return "Executou uma ação do agente";
};
const stateSummary = (value: PlaygroundRecord) => {
  const stage = value.stage as PlaygroundRecord | undefined;
  const customer = value.customer as PlaygroundRecord | undefined;
  return [
    stage?.name ? `Etapa: ${String(stage.name)}` : null,
    customer?.name ? `Cliente: ${String(customer.name)}` : null,
  ].filter(Boolean).join(" · ") || "Sem informações adicionais";
};
const configuredPrompt = (sections: Array<{ title: string; content: string }>) =>
  sections.find((section) => section.title === "Objetivo, tom e restrições do administrador")?.content.replace(/^#[^\n]+\n/, "") ?? "A configuração do agente ainda não está disponível.";

function ScenarioEditor({ scenario, pipeline, playableStages, pipelineStages, onChange, onApply, pending, canApply }: {
  scenario: PlaygroundScenario;
  pipeline?: PlaygroundPipelineContext;
  playableStages: PipelineStageMinimal[];
  pipelineStages: PipelineStageMinimal[];
  onChange: (next: PlaygroundScenario) => void;
  onApply: () => void;
  pending: boolean;
  canApply: boolean;
}) {
  const addFollowUp = () => onChange({ ...scenario, followUps: [...scenario.followUps, { name: "Retorno de teste", delaySeconds: 3600 }] });
  const addEvent = () => onChange({ ...scenario, calendar: { ...scenario.calendar, events: [...scenario.calendar.events, { title: "Evento fictício" }] } });

  return <Card className="h-full overflow-auto">
    <CardHeader><CardTitle>Cenário fictício</CardTitle><CardDescription>Dados desta área só existem na simulação.</CardDescription></CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="customer-name">Cliente</Label><Input id="customer-name" value={scenario.customer.name} onChange={(event) => onChange({ ...scenario, customer: { ...scenario.customer, name: event.target.value } })} /></div><div><Label htmlFor="customer-email">E-mail</Label><Input id="customer-email" type="email" value={scenario.customer.email ?? ""} onChange={(event) => onChange({ ...scenario, customer: { ...scenario.customer, email: event.target.value || undefined } })} /></div><div><Label htmlFor="deal-title">Negócio (opcional)</Label><Input id="deal-title" value={scenario.deal?.title ?? ""} placeholder="Sem negócio" onChange={(event) => onChange({ ...scenario, deal: event.target.value ? { ...(scenario.deal ?? {}), title: event.target.value } : null })} /></div><div><Label>Pipeline</Label><p className="mt-2 text-sm font-medium">{pipeline?.name ?? "Carregando funil…"}</p></div><div><Label>Etapa atual</Label><Select value={scenario.stage.id} onValueChange={(stageId) => { const stage = playableStages.find((item) => item.id === stageId); if (stage) onChange({ ...scenario, stage: { ...scenario.stage, id: stage.id, name: stage.name } }); }} disabled={!playableStages.length}><SelectTrigger><SelectValue placeholder="Nenhuma etapa disponível" /></SelectTrigger><SelectContent>{pipelineStages.map((stage) => { const hasAgent = Boolean(stage.assistantPipelineStage); const hasConditions = Boolean(stage.assistantPipelineStage?.assistantAllowedTargetStages.length); return <SelectItem key={stage.id} value={stage.id} disabled={!hasConditions}>{stage.name}{!hasAgent ? " — agente não atua nesta etapa" : !hasConditions ? " — sem condições de movimentação" : ""}</SelectItem>; })}</SelectContent></Select>{!playableStages.length && <p className="mt-1 text-xs text-destructive">Edite uma etapa para habilitar o agente e configurar movimentações.</p>}</div></div>
      <div className="space-y-2"><Label>Follow-ups simulados</Label><div className="flex flex-wrap gap-2">{scenario.followUps.map((item, index) => <Badge key={index} variant="secondary">{String(item.name ?? "Follow-up")}</Badge>)}<Button type="button" size="sm" variant="outline" onClick={addFollowUp} disabled={!scenario.stage.canCreateFollowUp}><Plus className="mr-1 h-3 w-3" />Follow-up</Button></div>{!scenario.stage.canCreateFollowUp && <p className="text-xs text-muted-foreground">O agente não pode criar follow-ups nesta etapa.</p>}</div>
      <div className="flex items-center justify-between gap-3 rounded-md border p-3"><div><Label htmlFor="calendar-enabled">Calendário</Label><p className="text-xs text-muted-foreground">Disponibiliza agenda fictícia ao agente.</p></div><Switch id="calendar-enabled" checked={scenario.calendar.active} onCheckedChange={(active) => onChange({ ...scenario, calendar: { ...scenario.calendar, active } })} /></div>
      {scenario.calendar.active && <Button type="button" size="sm" variant="outline" onClick={addEvent}><Plus className="mr-1 h-3 w-3" />Adicionar evento fictício</Button>}
      <Button type="button" className="w-full" variant="outline" onClick={onApply} disabled={!canApply || pending}>Aplicar cenário à sessão</Button>
      {!canApply && <p className="text-xs text-muted-foreground">Envie a primeira mensagem para criar a sessão e aplicar alterações ao cenário.</p>}
    </CardContent>
  </Card>;
}

function Diagnostic({ diagnostic, fallback }: { diagnostic?: PlaygroundDiagnostic | PlaygroundTurnResult; fallback: PlaygroundScenario }) {
  const result = diagnostic && "simulatedToolCalls" in diagnostic ? diagnostic : undefined;
  const persisted = diagnostic && !("simulatedToolCalls" in diagnostic) ? diagnostic : undefined;
  const calls = result?.simulatedToolCalls ?? persisted?.toolCalls ?? [];
  const latency = result?.latencies ?? persisted?.latencies;
  return <Card className="h-full overflow-auto"><CardHeader><CardTitle>Diagnóstico do último turno</CardTitle><CardDescription>Informações seguras da execução isolada.</CardDescription></CardHeader><CardContent><Tabs defaultValue="result"><TabsList className="w-full"><TabsTrigger value="result">Resultado</TabsTrigger><TabsTrigger value="prompt">Prompt</TabsTrigger><TabsTrigger value="state">Estado</TabsTrigger></TabsList><TabsContent value="result" className="space-y-3"><div><Label>Resposta</Label><p className="mt-1 rounded-md bg-muted p-2 text-sm">{result?.visibleResponse ?? persisted?.visibleResponse ?? "Aguardando um turno."}</p></div><div><Label>Ações que o agente pode executar</Label><div className="mt-1 flex flex-wrap gap-2">{[...new Set((result?.availableTools ?? persisted?.availableTools ?? []).map((tool) => toolLabel(String(tool.name ?? ""))))].map((label) => <span key={label} className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground">{label}</span>)}</div></div><div><Label>Ações realizadas neste turno</Label>{calls.length ? calls.map((call) => <p key={call.id} className="mt-1 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-800 dark:text-emerald-300"><span aria-hidden="true">✓</span>{toolCallSummary(call)}</p>) : <p className="text-sm text-muted-foreground">Nenhuma ação interna neste turno.</p>}</div><div className="space-y-2">{(result?.warnings ?? persisted?.warnings ?? []).map((warning) => <p key={warning} className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">{warning}</p>)}{(result?.errors ?? persisted?.errors ?? []).map((item) => <p key={item.code} className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{item.message}</p>)}</div>{latency?.totalMs !== undefined && <p className="text-xs text-muted-foreground">Latência total: {latency.totalMs}ms</p>}</TabsContent><TabsContent value="prompt" className="space-y-2"><p className="text-sm text-muted-foreground">Esta é a configuração informada para o agente. Regras e instruções internas da plataforma permanecem protegidas.</p><p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{configuredPrompt(result?.promptSections ?? persisted?.promptSections ?? [])}</p></TabsContent><TabsContent value="state" className="space-y-3"><div><Label>Antes do turno</Label><p className="mt-1 rounded-md bg-muted p-2 text-sm">{stateSummary((result?.stateBefore ?? persisted?.stateBefore ?? fallback) as PlaygroundRecord)}</p></div><div><Label>Depois do turno</Label><p className="mt-1 rounded-md bg-muted p-2 text-sm">{stateSummary((result?.stateAfter ?? persisted?.stateAfter ?? fallback) as PlaygroundRecord)}</p></div></TabsContent></Tabs></CardContent></Card>;
}

export default function AssistantPlaygroundPage({ assistantId: assistantIdProp, configuration: configurationProp, embedded = false, workspaceId: workspaceIdProp, pipeline: pipelineProp }: AssistantPlaygroundPageProps) {
  const { id: routeAssistantId = "" } = useParams();
  const assistantId = assistantIdProp ?? routeAssistantId;
  const { workspaceId: managedWorkspaceId } = useWorkspaceManager();
  const workspaceId = workspaceIdProp ?? managedWorkspaceId;
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const diagnosticAttentionTimeout = useRef<number>();
  const sessionId = searchParams.get("session") ?? undefined;
  const launch = location.state as PlaygroundLaunchState | null;
  const configuration = useMemo<PlaygroundConfiguration>(() => configurationProp ?? launch?.configuration ?? { mode: "saved", assistantId }, [configurationProp, launch, assistantId]);
  const [scenario, setScenario] = useState(initialScenario);
  const [message, setMessage] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [turn, setTurn] = useState<PlaygroundTurnResult>();
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [diagnosticAttention, setDiagnosticAttention] = useState(false);
  const isMobileViewport = () => window.matchMedia("(max-width: 1023px)").matches;
  const boundPipelineQuery = useQuery({ queryKey: ["playground-pipeline", workspaceId, assistantId], queryFn: async () => (await listPipelines(workspaceId!)).find((item) => item.assistantId === assistantId) ?? null, enabled: Boolean(!pipelineProp && workspaceId && assistantId && configuration.mode !== "draft") });
  const resolvedPipeline = pipelineProp ?? (boundPipelineQuery.data ? { id: boundPipelineQuery.data.id, name: boundPipelineQuery.data.name, stages: [] } : undefined);
  const persistedStagesQuery = useQuery({ queryKey: ["playground-pipeline-stages", workspaceId, resolvedPipeline?.id], queryFn: () => listPipelineStages(resolvedPipeline!.id!, workspaceId!), enabled: Boolean(!pipelineProp && resolvedPipeline?.id && workspaceId) });
  const pipeline = pipelineProp ? pipelineProp : resolvedPipeline ? { ...resolvedPipeline, stages: persistedStagesQuery.data ?? [] } : undefined;
  const pipelineStages = pipeline?.stages ?? [];
  const playableStages = pipelineStages.filter((stage) => Boolean(stage.assistantPipelineStage?.assistantAllowedTargetStages.length));
  const selectedStage = playableStages.find((stage) => stage.id === scenario.stage.id) ?? playableStages[0];
  const scopedScenario = useMemo<PlaygroundScenario>(() => {
    if (!pipeline || !selectedStage) return scenario;
    const allowedTargetStages = selectedStage.assistantPipelineStage?.assistantAllowedTargetStages.map((target) => ({ ...target, targetStageName: pipeline.stages.find((stage) => stage.id === target.targetStageId)?.name })) ?? [];
    return { ...scenario, pipeline: { id: pipeline.id, name: pipeline.name }, stage: { ...scenario.stage, id: selectedStage.id, name: selectedStage.name, allowedTargetStages, canCreateFollowUp: selectedStage.assistantPipelineStage?.canCreateFollowUp ?? false } };
  }, [pipeline, scenario, selectedStage]);
  const canStartConversation = Boolean(workspaceId && pipeline && selectedStage);
  const sessionQuery = useQuery({ queryKey: ["assistant-playground", workspaceId, assistantId, sessionId], queryFn: () => getPlaygroundSession(sessionId!, workspaceId!), enabled: Boolean(sessionId && workspaceId), retry: false });
  const current = sessionQuery.data;
  const activeConfiguration = current?.configuration ?? configuration;
  const isDraft = activeConfiguration.mode === "draft";
  const updateCache = (data: PlaygroundSession) => queryClient.setQueryData(["assistant-playground", workspaceId, assistantId, data.id], data);

  useEffect(() => { if (current) setScenario(current.simulatedState); }, [current]);
  useEffect(() => { if (selectedStage && selectedStage.id !== scenario.stage.id) setScenario((currentScenario) => ({ ...currentScenario, stage: { ...currentScenario.stage, id: selectedStage.id, name: selectedStage.name } })); }, [scenario.stage.id, selectedStage]);
  useEffect(() => { if (sessionQuery.isError && errorStatus(sessionQuery.error)?.status === 404) { setSearchParams({}); setError("A sessão expirou ou não pertence ao workspace atual."); } }, [sessionQuery.isError, sessionQuery.error, setSearchParams]);
  useEffect(() => () => window.clearTimeout(diagnosticAttentionTimeout.current), []);

  const updateScenario = useMutation({ mutationFn: () => current ? updatePlaygroundScenario(current.id, scopedScenario, workspaceId!) : Promise.reject(new Error("Crie uma sessão antes de aplicar o cenário.")), onSuccess: (data) => { updateCache(data); setTurn(undefined); setError(""); }, onError: () => setError("Não foi possível atualizar o cenário.") });
  const reset = useMutation({ mutationFn: () => current ? resetPlaygroundSession(current.id, workspaceId!) : Promise.reject(new Error("Crie uma sessão antes de reiniciar.")), onSuccess: (data) => { updateCache(data); setTurn(undefined); setMessage(""); setError(""); }, onError: (cause: unknown) => setError(errorStatus(cause)?.status === 404 ? "A sessão expirou. Envie uma mensagem para iniciar outra conversa." : "Não foi possível iniciar uma nova conversa.") });
  const send = useMutation({
    mutationFn: async () => {
      const content = message.trim();
      if (!workspaceId) throw new Error("WORKSPACE_REQUIRED");
      if (isDraft && !apiKey) throw new Error("API_KEY_REQUIRED");
      if (!canStartConversation) throw new Error("PIPELINE_REQUIRED");
      const session = current ?? await createPlaygroundSession({ workspaceId, configuration, scenario: scopedScenario });
      if (!current) { updateCache(session); setSearchParams({ session: session.id }); }
      return sendPlaygroundMessage(session.id, content, workspaceId, isDraft ? apiKey : undefined);
    },
    onSuccess: (data) => { setTurn(data); setMessage(""); setApiKey(""); setError(""); window.clearTimeout(diagnosticAttentionTimeout.current); setDiagnosticAttention(false); window.requestAnimationFrame(() => { setDiagnosticAttention(true); diagnosticAttentionTimeout.current = window.setTimeout(() => setDiagnosticAttention(false), 1500); }); void queryClient.invalidateQueries({ queryKey: ["assistant-playground", workspaceId, assistantId] }); },
    onError: (cause: unknown) => { const status = errorStatus(cause)?.status; const code = cause instanceof Error ? cause.message : ""; setError(code === "WORKSPACE_REQUIRED" ? "Selecione um workspace antes de iniciar a conversa." : code === "PIPELINE_REQUIRED" ? "Este agente não está vinculado a uma etapa habilitada do funil." : code === "API_KEY_REQUIRED" || status === 422 ? "Informe a credencial efêmera para este turno." : status === 429 ? "Limite de mensagens atingido. Tente novamente em instantes." : status === 404 ? "A sessão expirou. Envie a mensagem novamente para iniciar outra conversa." : "Não foi possível executar este turno."); },
  });
  const transcript = turn?.transcript ?? current?.transcript ?? [];
  const lastDiagnostic = turn ?? current?.diagnostics.at(-1);
  const submit = (event: FormEvent) => { event.preventDefault(); if (message.trim() && !send.isPending && canStartConversation) send.mutate(); };
  const scenarioPanel = <ScenarioEditor scenario={scopedScenario} pipeline={pipeline} playableStages={playableStages} pipelineStages={pipelineStages} onChange={setScenario} onApply={() => updateScenario.mutate()} pending={updateScenario.isPending} canApply={Boolean(current)} />;
  const diagnosticPanel = <Diagnostic diagnostic={lastDiagnostic} fallback={scenario} />;

  const toggleScenario = () => {
    const next = !scenarioOpen;
    setScenarioOpen(next);
    if (next && isMobileViewport()) setDiagnosticOpen(false);
  };
  const toggleDiagnostic = () => {
    const next = !diagnosticOpen;
    setDiagnosticOpen(next);
    setDiagnosticAttention(false);
    if (next && isMobileViewport()) setScenarioOpen(false);
  };

  useEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-playground-transcript]").forEach((element) => {
      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    });
  }, [send.isPending, transcript.length]);

  return <div className="space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><div>{!embedded && <Link to="/pipelines"><Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" />Voltar aos funis</Button></Link>}<h1 className={embedded ? "text-xl font-semibold" : "text-3xl font-bold"}>Simulador do Agente</h1><p className="text-muted-foreground">Converse com uma cópia isolada: CRM, pipeline, calendário e follow-ups reais não são alterados.</p>{launch?.notice && <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">{launch.notice}</p>}</div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={toggleScenario} aria-pressed={scenarioOpen}><PanelLeft className="mr-2 h-4 w-4" />Cenário</Button><Button type="button" variant="outline" onClick={toggleDiagnostic} aria-pressed={diagnosticOpen} className={diagnosticAttention ? "animate-[pulse_0.75s_ease-in-out_2] bg-primary/10 ring-2 ring-primary ring-offset-1" : undefined}><Bug className="mr-2 h-4 w-4" />Diagnóstico</Button><Button type="button" variant="outline" onClick={() => reset.mutate()} disabled={!current || reset.isPending}><RotateCcw className="mr-2 h-4 w-4" />Nova conversa</Button></div></div>
    {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {!workspaceId && <p role="status" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">Selecione um workspace para iniciar a conversa de teste.</p>}
    {workspaceId && !pipeline && !boundPipelineQuery.isLoading && <p role="status" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">Este agente não está vinculado a um funil neste workspace.</p>}
    {pipeline && !pipelineStages.length && <p role="status" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">Este funil ainda não possui etapas para simular.</p>}
    {pipeline && pipelineStages.length > 0 && !playableStages.length && <p role="status" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">Nenhuma etapa possui condições de movimentação configuradas para o agente. Edite uma etapa antes de testar.</p>}
    <div className="hidden min-h-[560px] gap-4 lg:flex">{scenarioOpen && <aside className="w-96 shrink-0">{scenarioPanel}</aside>}<section className="min-w-0 flex-1"><Card className="min-h-[560px]"><CardHeader><CardTitle>Conversa simulada</CardTitle><CardDescription>{current ? `Sessão criada às ${new Date(current.createdAt).toLocaleTimeString()}` : "Envie a primeira mensagem para iniciar."}</CardDescription></CardHeader><CardContent className="flex h-[480px] flex-col"><div data-playground-transcript className="flex-1 space-y-3 overflow-y-auto pr-1">{transcript.length ? transcript.map((item, index) => <div key={`${item.createdAt}-${index}`} className={item.role === "user" ? "ml-auto max-w-[85%] rounded-lg bg-primary p-3 text-primary-foreground" : item.role === "tool" ? "mx-auto max-w-[85%] px-3 py-1 text-center text-xs text-muted-foreground" : "mr-auto max-w-[85%] rounded-lg bg-muted p-3"}><>{item.role !== "tool" && <p className="text-xs opacity-70">{item.role === "user" ? "Cliente" : "Agente"}</p>}<p className={item.role === "tool" ? "whitespace-pre-wrap" : "whitespace-pre-wrap text-sm"}>{item.content}</p></></div>) : <p className="pt-20 text-center text-sm text-muted-foreground">Escreva como o cliente para começar a conversa.</p>}{send.isPending && <div role="status" aria-live="polite" className="mr-auto flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground"><span>O agente está pensando</span><span className="flex gap-1"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" /></span></div>}</div>{isDraft && <div className="mt-3"><Label htmlFor="playground-api-key">Credencial efêmera</Label><Input id="playground-api-key" value={apiKey} onChange={(event) => setApiKey(event.target.value)} type="password" autoComplete="off" placeholder="Obrigatória a cada turno" disabled={!workspaceId || send.isPending} /><p className="mt-1 text-xs text-muted-foreground">Enviada só neste turno; não é salva, exibida nem incluída na URL.</p></div>}<form className="mt-4 flex gap-2" onSubmit={submit}><Input aria-label="Mensagem do cliente" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Escreva como o cliente..." disabled={!workspaceId || send.isPending} /><Button type="submit" size="icon" aria-label="Enviar mensagem" disabled={!canStartConversation || !message.trim() || send.isPending}><Send className="h-4 w-4" /></Button></form></CardContent></Card></section>{diagnosticOpen && <aside className="w-[27.5rem] shrink-0">{diagnosticPanel}</aside>}</div>
    <div className="lg:hidden"><Card><CardHeader><CardTitle>Conversa simulada</CardTitle><CardDescription>{current ? `Sessão criada às ${new Date(current.createdAt).toLocaleTimeString()}` : "Envie a primeira mensagem para iniciar."}</CardDescription></CardHeader><CardContent className="flex h-[480px] flex-col"><div data-playground-transcript className="flex-1 space-y-3 overflow-y-auto pr-1">{transcript.length ? transcript.map((item, index) => <div key={`${item.createdAt}-${index}`} className={item.role === "user" ? "ml-auto max-w-[85%] rounded-lg bg-primary p-3 text-primary-foreground" : item.role === "tool" ? "mx-auto max-w-[85%] px-3 py-1 text-center text-xs text-muted-foreground" : "mr-auto max-w-[85%] rounded-lg bg-muted p-3"}><>{item.role !== "tool" && <p className="text-xs opacity-70">{item.role === "user" ? "Cliente" : "Agente"}</p>}<p className={item.role === "tool" ? "whitespace-pre-wrap" : "whitespace-pre-wrap text-sm"}>{item.content}</p></></div>) : <p className="pt-20 text-center text-sm text-muted-foreground">Escreva como o cliente para começar a conversa.</p>}{send.isPending && <div role="status" aria-live="polite" className="mr-auto flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground"><span>O agente está pensando</span><span className="flex gap-1"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" /></span></div>}</div>{isDraft && <div className="mt-3"><Label htmlFor="playground-api-key-mobile">Credencial efêmera</Label><Input id="playground-api-key-mobile" value={apiKey} onChange={(event) => setApiKey(event.target.value)} type="password" autoComplete="off" placeholder="Obrigatória a cada turno" disabled={!workspaceId || send.isPending} /><p className="mt-1 text-xs text-muted-foreground">Enviada só neste turno; não é salva, exibida nem incluída na URL.</p></div>}<form className="mt-4 flex gap-2" onSubmit={submit}><Input aria-label="Mensagem do cliente" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Escreva como o cliente..." disabled={!workspaceId || send.isPending} /><Button type="submit" size="icon" aria-label="Enviar mensagem" disabled={!canStartConversation || !message.trim() || send.isPending}><Send className="h-4 w-4" /></Button></form></CardContent></Card></div>
    <Sheet open={scenarioOpen} onOpenChange={setScenarioOpen}><SheetContent side="left" className="w-full overflow-auto sm:max-w-lg"><SheetHeader><SheetTitle>Cenário</SheetTitle><SheetDescription>Configure os dados fictícios da conversa.</SheetDescription></SheetHeader><div className="mt-4">{scenarioPanel}</div></SheetContent></Sheet><Sheet open={diagnosticOpen} onOpenChange={setDiagnosticOpen}><SheetContent side="right" className="w-full overflow-auto sm:max-w-lg"><SheetHeader><SheetTitle>Diagnóstico</SheetTitle><SheetDescription>Informações da última resposta simulada.</SheetDescription></SheetHeader><div className="mt-4">{diagnosticPanel}</div></SheetContent></Sheet>
  </div>;
}
