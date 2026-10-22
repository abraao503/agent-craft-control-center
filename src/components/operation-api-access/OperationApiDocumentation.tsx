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
      stageHistory: [
        { eventId: "stage-event-id", status: "IN_PROGRESS", enteredAt: "2026-01-15T14:20:00.000Z" },
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
  const changesCurl = `curl "${changes}?limit=100&cursor=<nextCursor>" \\
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
          <p className="text-muted-foreground">A contagem é compartilhada entre a consulta completa e <code>/changes</code>. Respostas bem-sucedidas informam <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code> e <code>X-RateLimit-Reset</code>. Em <code>429</code>, aguarde o número inteiro de segundos em <code>Retry-After</code> e repita com o mesmo cursor. Se o Redis estiver indisponível, a API retorna <code>503</code> sem consultar dados.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Lista inicial</CardTitle><CardDescription>Um item representa um ciclo de atendimento. As datas são ISO 8601 em UTC.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <CodeBlock label="GET · consulta paginada" value={base} onCopy={onCopy} />
          <p className="text-sm text-muted-foreground">Filtros opcionais: <code>attendanceId</code>, <code>customerId</code>, <code>phone</code>, <code>status</code>, <code>assigneeUserId</code>, <code>createdFrom</code>, <code>createdTo</code>, <code>updatedFrom</code> e <code>updatedTo</code>. Use <code>page</code> (a partir de 1) e <code>limit</code> (1 a 100).</p>
          <CodeBlock label="Exemplo cURL" value={curl} onCopy={onCopy} />
          <CodeBlock label="Resposta reduzida" value={JSON.stringify(exampleResponse, null, 2)} onCopy={onCopy} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5" />Sincronização incremental</CardTitle><CardDescription>Use a revisão para manter uma cópia externa atualizada sem perder alterações antigas.</CardDescription></CardHeader>
        <CardContent className="space-y-5 text-sm">
          <CodeBlock label="GET · alterações" value={changes} onCopy={onCopy} />
          <CodeBlock label="Continuação" value={changesCurl} onCopy={onCopy} />
          <p className="text-muted-foreground">Na primeira chamada omita <code>cursor</code>. Enquanto <code>hasMore</code> for <code>true</code>, envie o <code>nextCursor</code> exatamente como foi recebido. O cursor é assinado, limitado ao workspace e representa uma posição estável; alterações que chegam durante a paginação aparecem na próxima rodada.</p>
          <p className="text-muted-foreground">Cada evento é um <code>UPSERT</code> ou <code>DELETE</code> identificado por <code>attendanceId</code>. Portanto, processe com at-least-once e use essa identidade como chave idempotente. Exclusões e contatos movidos para fora do workspace aparecem como <code>DELETE</code>. Tags, responsável, atribuição e nomes também geram revisão quando mudam.</p>
          <Separator />
          <p className="text-muted-foreground">A primeira resposta pode ser <code>HUMAN</code>, <code>ASSISTANT</code> ou <code>INTEGRATION</code>. Quando a origem não tem vínculo explícito, o campo correspondente fica nulo e a disponibilidade informa o motivo; a API não estima datas.</p>
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
