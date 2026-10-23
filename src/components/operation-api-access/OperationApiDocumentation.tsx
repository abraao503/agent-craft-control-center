import { Copy, Database, ExternalLink, KeyRound, RefreshCw } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Props {
  workspaceId: string;
  onCopy: (value: string) => void;
}

const exampleResponse = {
  items: [
    {
      id: "attendance-id",
      cycleNumber: 2,
      status: "IN_PROGRESS",
      createdAt: "2026-01-15T14:20:00.000Z",
      updatedAt: "2026-01-15T14:32:00.000Z",
      contact: {
        id: "contact-id",
        name: "Contato de exemplo",
        phone: "+5511999990000",
        origin: null,
        tags: [{ id: "tag-id", name: "Prioridade" }],
      },
      firstCustomerMessage: {
        id: "message-id",
        occurredAt: "2026-01-15T14:21:00.000Z",
        senderType: "CUSTOMER",
      },
      firstResponse: {
        id: "response-id",
        occurredAt: "2026-01-15T14:24:00.000Z",
        senderType: "ASSISTANT",
      },
      firstHumanResponse: {
        id: "human-response-id",
        occurredAt: "2026-01-15T14:27:00.000Z",
        senderType: "HUMAN",
      },
      humanResponseTimeSeconds: 360,
      metricsCalculatedAt: "2026-01-15T14:32:00.000Z",
      historyActivatedAt: "2026-01-01T00:00:00.000Z",
      historyCompleteness: "COMPLETE",
      messageHistoryAvailability: {
        customer: "AVAILABLE",
        response: "AVAILABLE",
      },
      stageHistory: [
        {
          eventId: "stage-event-id",
          status: "IN_PROGRESS",
          enteredAt: "2026-01-15T14:20:00.000Z",
          exitedAt: null,
          durationSeconds: 720,
          isOngoing: true,
        },
      ],
      assigneeHistory: [
        {
          assignee: { type: "HUMAN", id: "user-id", name: "Atendente" },
          enteredAt: "2026-01-15T14:22:00.000Z",
          exitedAt: null,
          durationSeconds: 600,
          isOngoing: true,
          sourceEvent: {
            id: "assignment-event-id",
            action: "ASSIGN",
            aggregateVersion: 3,
          },
        },
      ],
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
};

export function OperationApiDocumentation({ workspaceId, onCopy }: Props) {
  const base = `${api.defaults.baseURL ?? ""}/integrations/operation/v1/workspaces/${workspaceId}/attendances`;
  const changes = `${base}/changes`;
  const curl = `curl "${base}?status=IN_PROGRESS&limit=20" \\
  -H "X-API-Key: <chave do workspace>"`;
  const changesCurl = `curl "${changes}?limit=200&cursor=<nextCursor>" \\
  -H "X-API-Key: <chave do workspace>"`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Autenticação e cota</CardTitle>
          <CardDescription>As rotas são somente leitura e usam uma chave criada para este workspace operacional.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-lg border bg-muted/30 p-4"><strong>Header obrigatório:</strong> <code>X-API-Key: &lt;chave&gt;</code></div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div><p className="text-muted-foreground">Limite</p><p className="font-semibold">60 chamadas</p></div>
            <div><p className="text-muted-foreground">Janela</p><p className="font-semibold">60 segundos móveis</p></div>
            <div><p className="text-muted-foreground">Escopo</p><p className="font-semibold">Workspace, todas as chaves</p></div>
          </div>
          <p className="text-muted-foreground">A contagem é compartilhada entre a consulta completa e <code>/changes</code>. Respostas bem-sucedidas informam <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code> e <code>X-RateLimit-Reset</code>. Em <code>429</code>, aguarde o número inteiro de segundos em <code>Retry-After</code> e repita com o mesmo cursor.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Lista inicial</CardTitle><CardDescription>Um item representa um ciclo de atendimento. As datas são ISO 8601 em UTC.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <CodeBlock label="GET · consulta paginada" value={base} onCopy={onCopy} />
          <p className="text-sm text-muted-foreground">Filtros opcionais: <code>attendanceId</code>, <code>customerId</code>, <code>phone</code>, <code>status</code>, <code>assigneeUserId</code>, <code>createdFrom</code>, <code>createdTo</code>, <code>updatedFrom</code> e <code>updatedTo</code>. Use <code>page</code> (a partir de 1) e <code>limit</code> (1 a 200).</p>
          <CodeBlock label="Exemplo cURL" value={curl} onCopy={onCopy} />
          <CodeBlock label="Resposta reduzida" value={JSON.stringify(exampleResponse, null, 2)} onCopy={onCopy} />
          <Separator />
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><code>firstResponse</code> é a primeira resposta aceita, que pode ser <code>HUMAN</code>, <code>ASSISTANT</code> ou <code>INTEGRATION</code>. <code>firstHumanResponse</code> identifica separadamente a primeira resposta humana aceita depois da primeira mensagem explícita do cliente.</p>
            <p><code>humanResponseTimeSeconds</code> é um inteiro em segundos entre essas duas mensagens. Retorna <code>null</code> quando falta uma das evidências; duração real abaixo de um segundo pode aparecer como <code>0</code>. <code>metricsCalculatedAt</code> indica o instante usado para fechar períodos ainda abertos.</p>
            <p><code>stageHistory</code> e <code>assigneeHistory</code> preservam reentradas e transferências. <code>exitedAt: null</code> com <code>isOngoing: true</code> indica o período atual; a duração é calculada até <code>metricsCalculatedAt</code> e fica congelada após <code>CLOSED</code>.</p>
            <p><code>historyActivatedAt</code> é o marco a partir do qual o histórico é contado. <code>historyCompleteness</code> pode ser <code>COMPLETE</code>, <code>PARTIAL</code> (atendimento iniciado antes do marco) ou <code>UNAVAILABLE</code> quando o workspace ainda não possui o marco. O histórico anterior ao marco não é reconstruído.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5" />Sincronização incremental</CardTitle><CardDescription>Use a revisão para manter uma cópia externa atualizada sem perder alterações antigas.</CardDescription></CardHeader>
        <CardContent className="space-y-5 text-sm">
          <CodeBlock label="GET · alterações" value={changes} onCopy={onCopy} />
          <CodeBlock label="Continuação" value={changesCurl} onCopy={onCopy} />
          <p className="text-muted-foreground">Na primeira chamada omita <code>cursor</code>. Use <code>limit</code> entre 1 e 200. Enquanto <code>hasMore</code> for <code>true</code>, envie o <code>nextCursor</code> exatamente como foi recebido. O cursor é assinado, limitado ao workspace e representa uma posição estável; alterações que chegam durante a paginação aparecem na próxima rodada.</p>
          <p className="text-muted-foreground">Cada evento é um <code>UPSERT</code> ou <code>DELETE</code> identificado por <code>attendanceId</code>. Portanto, processe com at-least-once e use essa identidade como chave idempotente. Exclusões e contatos movidos para fora do workspace aparecem como <code>DELETE</code>. Tags, responsável, atribuição e nomes também geram revisão quando mudam.</p>
          <Separator />
          <p className="text-muted-foreground">A carga incremental usa o mesmo contrato da consulta completa: inclui métricas, períodos, marco de ativação e completude. Quando a origem não tem vínculo explícito, o campo correspondente fica nulo e a disponibilidade informa o motivo; a API não estima datas.</p>
          <p className="text-muted-foreground">Para consultas de alto volume, use filtros, paginação e o endpoint <code>/changes</code>; as duas rotas compartilham a cota atual de 60 chamadas por janela móvel de 60 segundos por workspace.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Erros e respostas</CardTitle><CardDescription>Trate os códigos sem expor a chave em logs ou mensagens.</CardDescription></CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p><code>400</code> parâmetros, datas ou cursor inválidos · <code>401</code> chave ausente, inválida ou revogada · <code>403</code> workspace sem acesso operacional · <code>429</code> cota do workspace excedida · <code>503</code> autenticação ou rate limit indisponível.</p>
          <div className="flex items-start gap-2 rounded-md border bg-muted/30 p-3"><ExternalLink className="mt-0.5 h-4 w-4 shrink-0" /><span>O segredo completo só aparece na criação. A listagem exibe apenas nome, prefixo, data e situação.</span></div>
        </CardContent>
      </Card>
    </div>
  );
}

function CodeBlock({ label, value, onCopy }: { label: string; value: string; onCopy: (value: string) => void }) {
  return <div><Label className="mb-2 block">{label}</Label><div className="relative rounded-lg bg-muted p-4"><pre className="overflow-x-auto whitespace-pre-wrap pr-10 text-xs">{value}</pre><Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={() => onCopy(value)} aria-label={`Copiar ${label}`}><Copy className="h-4 w-4" /></Button></div></div>;
}
