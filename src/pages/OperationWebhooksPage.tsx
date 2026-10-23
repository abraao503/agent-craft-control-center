import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Edit, Plus, RefreshCw, Webhook } from "lucide-react";
import { useOperationalWebhooks, useOperationalWebhookMutations } from "@/hooks/useOperationalWebhooks";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { usePermissions } from "@/hooks/usePermissions";
import { OperationWebhookStatusBadge } from "@/components/operation-webhooks/OperationWebhookStatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartPagination } from "@/components/common/SmartPagination";

const PAGE_SIZE = 12;

export default function OperationWebhooksPage() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const workspaceId = currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const canManage = has("manage:operation-channels");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | undefined>();
  const query = useOperationalWebhooks(workspaceId, { page, limit: PAGE_SIZE, status }, has("view:operation-channels"));
  const mutations = useOperationalWebhookMutations(workspaceId);

  if (currentWorkspace?.type !== "OPERATION") {
    return <section className="mx-auto w-full max-w-6xl"><Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Ambiente operacional não selecionado</AlertTitle><AlertDescription>Selecione um workspace de operação para administrar webhooks.</AlertDescription></Alert></section>;
  }

  if (query.isError) {
    return (
      <section className="mx-auto w-full max-w-6xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar os webhooks</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            Verifique o acesso ao canal operacional e tente novamente.
            <Button variant="outline" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching}>
              <RefreshCw className="mr-2 h-4 w-4" />Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  const items = query.data?.items ?? [];
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Operação / integrações</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Webhooks de mensagens</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Dispare mensagens de texto ou templates Meta usando o canal operacional conectado.</p>
        </div>
        {canManage && <Link to="/operation/webhooks/create" className={buttonVariants()}><Plus className="mr-2 h-4 w-4" />Novo webhook</Link>}
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={!status ? "secondary" : "outline"} size="sm" onClick={() => { setStatus(undefined); setPage(1); }}>Todos</Button>
        <Button variant={status === "ACTIVE" ? "secondary" : "outline"} size="sm" onClick={() => { setStatus("ACTIVE"); setPage(1); }}>Ativos</Button>
        <Button variant={status === "INACTIVE" ? "secondary" : "outline"} size="sm" onClick={() => { setStatus("INACTIVE"); setPage(1); }}>Inativos</Button>
      </div>

      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-48 rounded-xl" />)}</div>
      ) : !items.length ? (
        <Card><CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center"><Webhook className="h-12 w-12 text-muted-foreground" /><h2 className="text-lg font-semibold">Nenhum webhook operacional</h2><p className="max-w-md text-sm text-muted-foreground">Crie um webhook para receber solicitações e enviar mensagens pelo canal Meta do workspace.</p>{canManage && <Link to="/operation/webhooks/create" className={buttonVariants()}><Plus className="mr-2 h-4 w-4" />Criar primeiro webhook</Link>}</CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((webhook) => (
              <Card key={webhook.id} className="cursor-pointer transition hover:shadow-md" onClick={() => navigate(`/operation/webhooks/${webhook.id}`)}>
                <CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><Webhook className="h-5 w-5 shrink-0 text-primary" /><CardTitle className="truncate text-lg">{webhook.name}</CardTitle></div><OperationWebhookStatusBadge status={webhook.status} /></div><CardDescription>Canal Meta configurado</CardDescription></CardHeader>
                <CardContent className="space-y-4"><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Prefixo da chave</span><Badge variant="outline" className="font-mono">{webhook.keyPrefix}…</Badge></div><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); navigate(`/operation/webhooks/${webhook.id}`); }}><Edit className="mr-2 h-4 w-4" />Abrir</Button>{canManage && <Button variant="outline" size="sm" disabled={mutations.update.isPending} onClick={(event) => { event.stopPropagation(); mutations.update.mutate({ webhookId: webhook.id, status: webhook.status === "ACTIVE" ? "INACTIVE" : "ACTIVE", version: webhook.version }); }}>{webhook.status === "ACTIVE" ? "Inativar" : "Ativar"}</Button>}</div></CardContent>
              </Card>
            ))}
          </div>
          {query.data && query.data.totalPages > 1 && <SmartPagination currentPage={page} totalPages={query.data.totalPages} onPageChange={setPage} showItemCount itemsPerPage={query.data.limit} totalItems={query.data.total} itemLabel="webhooks" />}
        </>
      )}
    </section>
  );
}
