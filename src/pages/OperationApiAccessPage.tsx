import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Copy, KeyRound, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { useOperationalApiKeyMutations, useOperationalApiKeys } from "@/hooks/useOperationalApiKeys";
import { OperationApiDocumentation } from "@/components/operation-api-access/OperationApiDocumentation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OperationApiAccessPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const { toast } = useToast();
  const workspaceId = currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const canManage = has("manage:operation-api-access");
  const query = useOperationalApiKeys(workspaceId, canManage);
  const mutations = useOperationalApiKeyMutations(workspaceId);
  const [name, setName] = useState("");
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  useEffect(() => {
    setCreatedSecret(null);
    setRevokeId(null);
  }, [workspaceId]);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Copiado", description: "O valor foi copiado para a área de transferência." });
    } catch {
      toast({ title: "Não foi possível copiar", description: "Copie o valor manualmente.", variant: "destructive" });
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    mutations.create.mutate(trimmedName, {
      onSuccess: (result) => {
        setName("");
        setCreatedSecret(result.key);
        toast({ title: "Chave criada", description: "Copie o segredo agora; ele não será exibido novamente." });
      },
      onError: () => toast({ title: "Não foi possível criar a chave", description: "Verifique sua permissão e tente novamente.", variant: "destructive" }),
    });
  };

  const revoke = () => {
    if (!revokeId) return;
    mutations.revoke.mutate(revokeId, {
      onSuccess: () => {
        setRevokeId(null);
        toast({ title: "Chave revogada", description: "A chave deixou de autenticar novas consultas." });
      },
      onError: () => toast({ title: "Não foi possível revogar", description: "Tente novamente.", variant: "destructive" }),
    });
  };

  if (currentWorkspace?.type !== "OPERATION") {
    return <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Ambiente operacional não selecionado</AlertTitle><AlertDescription>Selecione um workspace de operação para administrar o acesso da integração.</AlertDescription></Alert>;
  }

  if (!canManage) {
    return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Acesso insuficiente</AlertTitle><AlertDescription>Você precisa da permissão de gerenciamento da API operacional para acessar esta área.</AlertDescription></Alert>;
  }

  const items = query.data?.items ?? [];

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Operação / integrações</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Acesso à API operacional</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Crie chaves de leitura para sincronizar os atendimentos do workspace com seu sistema externo. A consulta não altera a operação.</p>
      </header>

      {createdSecret && <Alert><CheckCircle2 className="h-4 w-4" /><AlertTitle>Chave criada — copie o segredo agora</AlertTitle><AlertDescription className="space-y-3"><p>Por segurança, o segredo completo só aparece nesta tela e não fica salvo na lista.</p><div className="flex items-center gap-2"><code className="min-w-0 flex-1 break-all rounded bg-muted px-3 py-2 text-sm">{createdSecret}</code><Button variant="outline" size="icon" onClick={() => void copy(createdSecret)} aria-label="Copiar segredo"><Copy className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setCreatedSecret(null)}>Fechar</Button></div></AlertDescription></Alert>}

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList aria-label="Acesso à API operacional">
          <TabsTrigger value="keys"><KeyRound className="mr-2 h-4 w-4" />Chaves</TabsTrigger>
          <TabsTrigger value="documentation"><ShieldCheck className="mr-2 h-4 w-4" />Documentação</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Nova chave de leitura</CardTitle><CardDescription>Escolha um nome que ajude a identificar o sistema que usará a integração.</CardDescription></CardHeader>
            <CardContent><form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={submit}><div className="flex-1 space-y-2"><Label htmlFor="operational-api-key-name">Nome da integração</Label><Input id="operational-api-key-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Data warehouse" maxLength={120} autoComplete="off" /></div><Button type="submit" disabled={!name.trim() || mutations.create.isPending}>{mutations.create.isPending ? "Criando…" : "Criar chave"}</Button></form></CardContent>
          </Card>

          {query.isError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Não foi possível carregar as chaves</AlertTitle><AlertDescription className="flex flex-wrap items-center gap-3">Verifique o acesso ao workspace e tente novamente.<Button variant="outline" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching}><RefreshCw className="mr-2 h-4 w-4" />Tentar novamente</Button></AlertDescription></Alert>}

          <Card><CardHeader><CardTitle>Chaves deste workspace</CardTitle><CardDescription>{query.data ? `${query.data.total} chave${query.data.total === 1 ? "" : "s"} registrada${query.data.total === 1 ? "" : "s"}.` : "Credenciais disponíveis para a integração."}</CardDescription></CardHeader><CardContent>
            {query.isLoading ? <div className="space-y-3">{[1, 2].map((item) => <Skeleton key={item} className="h-16 w-full rounded-lg" />)}</div> : !items.length ? <div className="rounded-lg border border-dashed p-8 text-center"><KeyRound className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">Nenhuma chave criada</h2><p className="mt-1 text-sm text-muted-foreground">Crie uma chave para começar a sincronização.</p></div> : <div className="space-y-3">{items.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{item.name}</p><Badge variant={item.status === "ACTIVE" ? "secondary" : "outline"}>{item.status === "ACTIVE" ? "Ativa" : "Revogada"}</Badge></div><p className="mt-1 text-sm text-muted-foreground"><code>{item.keyPrefix}…</code> · criada em {formatDate(item.createdAt)}{item.revokedAt ? ` · revogada em ${formatDate(item.revokedAt)}` : ""}</p></div>{item.status === "ACTIVE" && <Button variant="outline" size="sm" onClick={() => setRevokeId(item.id)} disabled={mutations.revoke.isPending}><Trash2 className="mr-2 h-4 w-4" />Revogar</Button>}</div>)}</div>}
          </CardContent></Card>
        </TabsContent>

          <TabsContent value="documentation"><OperationApiDocumentation workspaceId={currentWorkspace.id} onCopy={(value) => void copy(value)} /></TabsContent>
      </Tabs>

      <AlertDialog open={Boolean(revokeId)} onOpenChange={(open) => { if (!open) setRevokeId(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Revogar esta chave?</AlertDialogTitle><AlertDialogDescription>O sistema que usa esta credencial perderá acesso imediatamente. Essa ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={mutations.revoke.isPending}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); revoke(); }} disabled={mutations.revoke.isPending}>{mutations.revoke.isPending ? "Revogando…" : "Revogar chave"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
