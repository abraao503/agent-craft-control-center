import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Edit3, FileText, KeyRound, Loader2, RefreshCw, Settings, Webhook, X } from "lucide-react";
import { useOperationalChannels } from "@/hooks/useOperationalChannels";
import { useOperationalWebhook, useOperationalWebhookExecutions, useOperationalWebhookMutations } from "@/hooks/useOperationalWebhooks";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { OperationWebhookDocumentation } from "@/components/operation-webhooks/OperationWebhookDocumentation";
import { OperationWebhookExecutions } from "@/components/operation-webhooks/OperationWebhookExecutions";
import { OperationWebhookStatusBadge } from "@/components/operation-webhooks/OperationWebhookStatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/services/api";
import type { OperationalWebhookExecution, OperationalWebhookExecutionStatus } from "@/types/operational-webhook";

const errorLabels: Record<string, string> = {
  MESSAGE_INVALID_PHONE: "O telefone do contato é inválido.",
  MESSAGE_CHAT_NOT_FOUND: "O atendimento do contato não foi encontrado.",
  MESSAGE_INTEGRATION_REQUIRED: "O canal Meta não está configurado.",
  MESSAGE_INTEGRATION_NOT_FOUND: "O canal Meta configurado não foi encontrado.",
  MESSAGE_TOKEN_INVALID: "A credencial do canal Meta está inválida.",
  MESSAGE_REPLY_CONTEXT_STALE: "O contexto da conversa ficou desatualizado.",
  MESSAGE_WINDOW_CLOSED: "A janela de atendimento da Meta está fechada.",
  MESSAGE_OPT_IN_REQUIRED: "O contato não possui uma autorização válida para receber a mensagem.",
  MESSAGE_TEMPLATE_REQUIRED: "É necessário usar um template Meta aprovado.",
  MESSAGE_TEMPLATE_INVALID: "O template Meta ou seus parâmetros são inválidos.",
  MESSAGE_TEMPLATE_NOT_FOUND: "O template Meta não foi encontrado na conta.",
  MESSAGE_MEDIA_NOT_SUPPORTED: "Este tipo de mídia não é suportado pelo webhook.",
  MESSAGE_RATE_LIMITED: "O limite de envio da Meta foi atingido. Tente novamente depois.",
  MESSAGE_INVALID_CONSENT_TARGET: "O destinatário não pode receber esta mensagem.",
  MESSAGE_UNKNOWN: "A Meta não informou o motivo da falha no envio.",
  INVALID_PHONE: "O telefone informado é inválido.",
  TEMPLATE_NOT_FOUND: "O template não foi encontrado na conta Meta.",
  TEMPLATE_PARAMETERS_INVALID: "Os parâmetros do template não são compatíveis.",
  CHANNEL_UNAVAILABLE: "O canal Meta está indisponível.",
  MESSAGE_SEND_FAILED: "A Meta não aceitou o envio da mensagem.",
  WEBHOOK_INACTIVE: "O webhook está inativo.",
  CHAT_NOT_FOUND: "O atendimento do contato não foi encontrado.",
  ACTIVE_ATTENDANCE_CHANNEL_CONFLICT: "Já existe um atendimento ativo em outro canal.",
  CUSTOMER_CREATE_FAILED: "Não foi possível preparar o contato para o envio.",
  UNKNOWN: "O processamento não informou o motivo da falha.",
};

export default function OperationWebhookDetailPage() {
  const { webhookId } = useParams<{ webhookId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const workspaceId = currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const canManage = has("manage:operation-channels");
  const [page, setPage] = useState(1);
  const [executionStatus, setExecutionStatus] = useState<OperationalWebhookExecutionStatus>();
  const [selectedExecution, setSelectedExecution] = useState<OperationalWebhookExecution | null>(null);
  const [editing, setEditing] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const webhookQuery = useOperationalWebhook(workspaceId, webhookId, has("view:operation-channels"));
  const executionsQuery = useOperationalWebhookExecutions(workspaceId, webhookId, { page, limit: 10, status: executionStatus }, has("view:operation-channels"));
  const channelsQuery = useOperationalChannels(workspaceId, 1, has("view:operation-channels"), true, false);
  const mutations = useOperationalWebhookMutations(workspaceId);
  const [name, setName] = useState("");
  const [channelId, setChannelId] = useState("");

  const endpoint = webhookId ? `${api.defaults.baseURL ?? ""}/webhooks/operation/workspaces/${workspaceId}/${webhookId}/messages` : "";
  const copy = async (value: string) => { await navigator.clipboard.writeText(value); toast({ title: "Copiado", description: "O valor foi copiado para a área de transferência." }); };

  if (currentWorkspace?.type !== "OPERATION") return <Alert><AlertTitle>Ambiente operacional não selecionado</AlertTitle><AlertDescription>Selecione um workspace de operação.</AlertDescription></Alert>;
  if (webhookQuery.isLoading || !webhookQuery.data) return webhookQuery.isError ? <Alert variant="destructive"><AlertTitle>Webhook não encontrado</AlertTitle><AlertDescription>O webhook não está disponível no workspace atual.</AlertDescription></Alert> : <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  const webhook = webhookQuery.data;
  const channels = channelsQuery.data?.items.filter((channel) => channel.provider === "meta-cloud" && channel.active) ?? [];
  const channel = channels.find((item) => item.id === webhook.companyWhatsappIntegrationId);
  const openEditor = () => { setName(webhook.name); setChannelId(webhook.companyWhatsappIntegrationId); setEditing(true); };
  const saveEditor = () => mutations.update.mutate({ webhookId: webhook.id, name: name.trim(), companyWhatsappIntegrationId: channelId, version: webhook.version }, { onSuccess: () => { setEditing(false); toast({ title: "Webhook atualizado" }); }, onError: () => toast({ title: "Não foi possível atualizar", description: "Confira o nome e o canal selecionado.", variant: "destructive" }) });
  const regenerate = () => mutations.regenerate.mutate(webhook.id, { onSuccess: (result) => { setRegenerateOpen(false); setNewKey(result.key); toast({ title: "Chave regenerada", description: "A chave anterior deixou de funcionar." }); }, onError: () => toast({ title: "Não foi possível regenerar a chave", variant: "destructive" }) });

  return <section className="mx-auto flex w-full max-w-7xl flex-col gap-6"><header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><Link to="/operation/webhooks" className={buttonVariants({ variant: "ghost", size: "icon" })}><ArrowLeft className="h-5 w-5" /></Link><div><p className="text-sm font-medium uppercase tracking-wide text-primary">Operação / integrações</p><h1 className="mt-2 flex items-center gap-2 text-3xl font-semibold tracking-tight"><Webhook className="h-7 w-7" />{webhook.name}</h1><p className="mt-2 text-sm text-muted-foreground">Administre credencial, canal Meta e histórico de envios.</p></div></div><div className="flex flex-wrap items-center gap-2"><OperationWebhookStatusBadge status={webhook.status} />{canManage && <Button variant="outline" onClick={openEditor}><Edit3 className="mr-2 h-4 w-4" />Editar</Button>}</div></header><Tabs defaultValue="overview"><TabsList className="grid w-full grid-cols-3 sm:max-w-xl"><TabsTrigger value="overview"><Settings className="mr-2 h-4 w-4" />Visão geral</TabsTrigger><TabsTrigger value="history"><RefreshCw className="mr-2 h-4 w-4" />Execuções</TabsTrigger><TabsTrigger value="documentation"><FileText className="mr-2 h-4 w-4" />Documentação</TabsTrigger></TabsList><TabsContent value="overview" className="mt-6 space-y-6"><Card><CardHeader><CardTitle>Configuração atual</CardTitle><CardDescription>A chave completa nunca é retornada pela API depois da criação.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div><Label>Status</Label><div className="mt-2"><OperationWebhookStatusBadge status={webhook.status} /></div></div><div><Label>Prefixo da chave</Label><p className="mt-2"><Badge variant="outline" className="font-mono">{webhook.keyPrefix}…</Badge></p></div><div><Label>Canal Meta</Label><p className="mt-2 text-sm text-muted-foreground">{channel?.displayName || "Canal Meta configurado"}{channel?.metaDisplayPhoneNumber ? ` · ${channel.metaDisplayPhoneNumber}` : ""}</p></div></div><Separator /><div className="flex flex-wrap gap-2">{canManage && <><Button variant="outline" onClick={() => mutations.update.mutate({ webhookId: webhook.id, status: webhook.status === "ACTIVE" ? "INACTIVE" : "ACTIVE", version: webhook.version })}>{webhook.status === "ACTIVE" ? "Inativar webhook" : "Ativar webhook"}</Button><Button variant="outline" onClick={() => setRegenerateOpen(true)}><KeyRound className="mr-2 h-4 w-4" />Regenerar chave</Button></>}</div></CardContent></Card>{newKey && <Card className="border-amber-300"><CardHeader><CardTitle>Nova chave — copie agora</CardTitle><CardDescription>A chave anterior foi invalidada e esta não será exibida novamente.</CardDescription></CardHeader><CardContent><div className="flex items-center gap-2"><code className="min-w-0 flex-1 break-all rounded bg-muted px-3 py-2 text-sm">{newKey}</code><Button variant="outline" size="icon" onClick={() => void copy(newKey)} aria-label="Copiar nova chave"><Copy className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setNewKey(null)} aria-label="Ocultar nova chave"><X className="h-4 w-4" /></Button></div></CardContent></Card>}</TabsContent><TabsContent value="history" className="mt-6"><OperationWebhookExecutions data={executionsQuery.data} isLoading={executionsQuery.isLoading} isError={executionsQuery.isError} page={page} status={executionStatus} onPageChange={setPage} onStatusChange={(value) => { setExecutionStatus(value); setPage(1); }} onRetry={() => void executionsQuery.refetch()} onOpen={setSelectedExecution} /></TabsContent><TabsContent value="documentation" className="mt-6"><OperationWebhookDocumentation endpoint={endpoint} onCopy={(value) => void copy(value)} /></TabsContent></Tabs><Dialog open={editing} onOpenChange={setEditing}><DialogContent><DialogHeader><DialogTitle>Editar webhook</DialogTitle><DialogDescription>Atualize o nome, canal ou estado. A API valida o workspace e a versão.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor="edit-operation-webhook-name">Nome</Label><Input id="edit-operation-webhook-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} /></div><div className="space-y-2"><Label>Canal Meta</Label><Select value={channelId} onValueChange={setChannelId}><SelectTrigger><SelectValue placeholder="Selecione um canal" /></SelectTrigger><SelectContent>{channels.map((channel) => <SelectItem key={channel.id} value={channel.id}>{channel.displayName || "Canal Meta"}{channel.metaDisplayPhoneNumber ? ` · ${channel.metaDisplayPhoneNumber}` : ""}</SelectItem>)}</SelectContent></Select></div></div><DialogFooter><Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button><Button disabled={!name.trim() || !channelId || mutations.update.isPending} onClick={saveEditor}>{mutations.update.isPending ? "Salvando…" : "Salvar"}</Button></DialogFooter></DialogContent></Dialog><Dialog open={regenerateOpen} onOpenChange={setRegenerateOpen}><DialogContent><DialogHeader><DialogTitle>Regenerar chave?</DialogTitle><DialogDescription>A chave atual será invalidada imediatamente. Integrações que ainda usam a chave antiga deixarão de funcionar.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setRegenerateOpen(false)}>Cancelar</Button><Button variant="destructive" disabled={mutations.regenerate.isPending} onClick={regenerate}>{mutations.regenerate.isPending ? "Regenerando…" : "Regenerar"}</Button></DialogFooter></DialogContent></Dialog><Dialog open={Boolean(selectedExecution)} onOpenChange={(open) => { if (!open) setSelectedExecution(null); }}><DialogContent><DialogHeader><DialogTitle>Detalhes da execução</DialogTitle><DialogDescription>Resumo seguro do processamento; o payload bruto não é exibido.</DialogDescription></DialogHeader>{selectedExecution && <div className="space-y-4 text-sm"><div className="flex items-center gap-2"><OperationWebhookStatusBadge status={selectedExecution.status} /><span>{selectedExecution.kind === "TEMPLATE" ? "Template Meta" : "Mensagem de texto"}</span></div><div className="grid gap-3 sm:grid-cols-2"><div><Label>Telefone</Label><p className="mt-1 text-muted-foreground">Final {selectedExecution.phone.slice(-4)}</p></div><div><Label>Correlação</Label><p className="mt-1 text-muted-foreground">{selectedExecution.correlationId || "Não informada"}</p></div></div>{selectedExecution.errorCode && <Alert variant="destructive"><AlertTitle>{errorLabels[selectedExecution.errorCode] || "O processamento não foi concluído."}</AlertTitle><AlertDescription><p>Não foi possível enviar a mensagem. Tente novamente após corrigir a configuração.</p><div className="mt-2 space-y-1"><p><span className="font-medium">Código interno:</span> <code>{selectedExecution.errorCode}</code></p>{selectedExecution.providerErrorCode && <p><span className="font-medium">Código Meta:</span> <code>{selectedExecution.providerErrorCode}</code></p>}</div></AlertDescription></Alert>}{!selectedExecution.errorCode && selectedExecution.providerErrorCode && <div className="rounded-md border p-3"><p className="font-medium">Código Meta</p><code className="text-muted-foreground">{selectedExecution.providerErrorCode}</code></div>}</div>}</DialogContent></Dialog></section>;
}
