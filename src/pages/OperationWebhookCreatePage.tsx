import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Copy, KeyRound, Webhook } from "lucide-react";
import { useOperationalWebhookMutations } from "@/hooks/useOperationalWebhooks";
import { useOperationalChannels } from "@/hooks/useOperationalChannels";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { OperationWebhookDocumentation } from "@/components/operation-webhooks/OperationWebhookDocumentation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/services/api";

export default function OperationWebhookCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const workspaceId = currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const canManage = has("manage:operation-channels");
  const [name, setName] = useState("");
  const [channelId, setChannelId] = useState("");
  const [created, setCreated] = useState<{ webhookId: string; key: string } | null>(null);
  const channelsQuery = useOperationalChannels(workspaceId, 1, canManage, true, false);
  const mutations = useOperationalWebhookMutations(workspaceId);
  const channels = channelsQuery.data?.items.filter((channel) => channel.provider === "meta-cloud" && channel.active) ?? [];

  const endpointFor = (webhookId: string) => `${api.defaults.baseURL ?? ""}/webhooks/operation/workspaces/${workspaceId}/${webhookId}/messages`;
  const copy = async (value: string) => { await navigator.clipboard.writeText(value); toast({ title: "Copiado", description: "O valor foi copiado para a área de transferência." }); };

  if (currentWorkspace?.type !== "OPERATION") return <section className="mx-auto w-full max-w-6xl"><Alert><AlertTitle>Ambiente operacional não selecionado</AlertTitle><AlertDescription>Selecione um workspace de operação para criar o webhook.</AlertDescription></Alert></section>;
  if (!canManage) return <section className="mx-auto w-full max-w-6xl"><Alert variant="destructive"><AlertTitle>Acesso insuficiente</AlertTitle><AlertDescription>Você precisa de permissão para gerenciar canais operacionais.</AlertDescription></Alert></section>;

  if (created) {
    const endpoint = endpointFor(created.webhookId);
    return <section className="mx-auto w-full max-w-6xl space-y-6"><header className="flex items-center gap-3"><Link to="/operation/webhooks" className={buttonVariants({ variant: "ghost", size: "icon" })}><ArrowLeft className="h-5 w-5" /></Link><div><h1 className="text-3xl font-semibold tracking-tight">Webhook criado</h1><p className="text-sm text-muted-foreground">Guarde a chave agora. Ela não será exibida novamente.</p></div></header><Alert><CheckCircle2 className="h-4 w-4" /><AlertTitle>Credencial gerada com sucesso</AlertTitle><AlertDescription>Use a chave somente no header X-Webhook-Key e uma chave de idempotência por solicitação.</AlertDescription></Alert><Card><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Chave secreta</CardTitle><CardDescription>Este é o único momento em que a chave completa aparece.</CardDescription></CardHeader><CardContent><div className="flex items-center gap-2"><code className="min-w-0 flex-1 break-all rounded bg-muted px-3 py-2 text-sm">{created.key}</code><Button variant="outline" size="icon" onClick={() => void copy(created.key)} aria-label="Copiar chave"><Copy className="h-4 w-4" /></Button></div></CardContent></Card><OperationWebhookDocumentation endpoint={endpoint} onCopy={(value) => void copy(value)} /><div className="flex justify-end"><Button onClick={() => navigate(`/operation/webhooks/${created.webhookId}`)}>Abrir webhook</Button></div></section>;
  }

  return <section className="mx-auto w-full max-w-6xl space-y-6"><header className="flex items-center gap-3"><Link to="/operation/webhooks" className={buttonVariants({ variant: "ghost", size: "icon" })}><ArrowLeft className="h-5 w-5" /></Link><div><p className="text-sm font-medium uppercase tracking-wide text-primary">Operação / integrações</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Novo webhook de mensagens</h1><p className="mt-2 text-sm text-muted-foreground">Conecte a entrada externa a uma integração Meta fixa do workspace.</p></div></header><Card><CardHeader><CardTitle className="flex items-center gap-2"><Webhook className="h-5 w-5" />Configuração</CardTitle><CardDescription>A chave será gerada apenas após a criação.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="space-y-2"><Label htmlFor="operation-webhook-name">Nome</Label><Input id="operation-webhook-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Atualizações de pedidos" maxLength={120} /></div><div className="space-y-2"><Label htmlFor="operation-webhook-channel">Canal Meta</Label><Select value={channelId} onValueChange={setChannelId}><SelectTrigger id="operation-webhook-channel"><SelectValue placeholder={channelsQuery.isLoading ? "Carregando canais…" : "Selecione um canal Meta"} /></SelectTrigger><SelectContent>{channels.map((channel) => <SelectItem key={channel.id} value={channel.id}>{channel.displayName || "Canal Meta"}{channel.metaDisplayPhoneNumber ? ` · ${channel.metaDisplayPhoneNumber}` : ""}</SelectItem>)}</SelectContent></Select>{!channelsQuery.isLoading && !channels.length && <p className="text-sm text-muted-foreground">Nenhum canal Meta ativo encontrado. <Link to="/operation/channels" className="underline">Configure um canal</Link> antes de continuar.</p>}</div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => navigate("/operation/webhooks")}>Cancelar</Button><Button disabled={!name.trim() || !channelId || mutations.create.isPending} onClick={() => mutations.create.mutate({ name: name.trim(), companyWhatsappIntegrationId: channelId }, { onSuccess: (result) => setCreated({ webhookId: result.webhook.id, key: result.key }), onError: () => toast({ title: "Não foi possível criar", description: "Confira o nome e o canal selecionado.", variant: "destructive" }) })}>{mutations.create.isPending ? "Criando…" : "Criar webhook"}</Button></div></CardContent></Card></section>;
}
