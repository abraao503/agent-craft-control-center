import { Copy, ExternalLink, Webhook } from "lucide-react";
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
  endpoint: string;
  onCopy: (value: string) => void;
}

const textPayload = {
  phone: "+5511999887766",
  targetQueueId: "<UUID da fila ativa>",
  text: "Olá! Sua solicitação foi recebida.",
  correlationId: "pedido-123",
};

const templatePayload = {
  phone: "+5511999887766",
  targetQueueId: "<UUID da fila ativa>",
  template: {
    name: "pedido_atualizado",
    language: "pt_BR",
    parameters: ["João", "12345"],
  },
};

export function OperationWebhookDocumentation({ endpoint, onCopy }: Props) {
  const curlExample = `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Key: <chave exibida na criação>" \\
  -H "Idempotency-Key: pedido-123" \\
  -d '${JSON.stringify(textPayload)}'`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Endpoint do webhook
          </CardTitle>
          <CardDescription>
            Envie texto ou um template aprovado pela Meta para o canal configurado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>URL</Label>
            <div className="mt-1 flex items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded bg-muted px-3 py-2 text-sm">
                {endpoint}
              </code>
              <Button variant="outline" size="icon" onClick={() => onCopy(endpoint)} aria-label="Copiar URL">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span><strong className="text-foreground">Método:</strong> POST</span>
            <span><strong className="text-foreground">Header:</strong> X-Webhook-Key</span>
            <span><strong className="text-foreground">Idempotência:</strong> Idempotency-Key</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consultar uma execução</CardTitle>
          <CardDescription>
            O POST retorna um protocolo. Use o <strong>executionId</strong> para acompanhar o processamento na aba Execuções ou pela consulta administrativa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock
            label="Resposta do POST"
            value={JSON.stringify({ executionId: "<id-da-execucao>", status: "PENDING", duplicate: false }, null, 2)}
            onCopy={onCopy}
          />
          <CodeBlock
            label="Consulta administrativa"
            value="GET /operation/workspaces/{workspaceId}/webhooks/{webhookId}/executions/{executionId}"
            onCopy={onCopy}
          />
          <p className="text-sm text-muted-foreground">
            Os estados possíveis são PENDING, PROCESSING, ACCEPTED, FAILED e UNKNOWN. A tela mostra o status e uma mensagem segura para falhas, sem exibir o payload bruto.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payloads aceitos</CardTitle>
          <CardDescription>
            Informe exatamente um entre <code>text</code> e <code>template</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <CodeBlock label="Mensagem de texto" value={JSON.stringify(textPayload, null, 2)} onCopy={onCopy} />
          <CodeBlock label="Template Meta" value={JSON.stringify(templatePayload, null, 2)} onCopy={onCopy} />
          <div className="space-y-1 rounded-md border bg-muted/30 p-3 text-sm">
            <p className="font-medium">Direcionar para uma fila</p>
            <p className="text-muted-foreground">
              <code>targetQueueId</code> é opcional. Substitua o exemplo pelo ID
              de uma fila ativa do mesmo workspace do webhook; a área é
              identificada pela fila. Para encontrar o ID, abra Operação →
              Estrutura, selecione a área e abra a fila. Use <strong>Copiar ID</strong>
              na listagem ou no detalhe da fila. Remova o campo para seguir sem
              indicar uma fila.
            </p>
            <p className="text-muted-foreground">
              Quando informado, o atendimento é encaminhado para essa fila no
              disparo e a distribuição automática configurada para ela é
              executada. O webhook envia pela conexão Meta selecionada nele.
              Para conversas novas recebidas pelo WhatsApp, continua valendo a
              entrada padrão configurada no canal. Se a Meta recusar o envio
              depois do encaminhamento, o atendimento permanece aberto na fila.
            </p>
          </div>
          <Separator />
          <CodeBlock label="Exemplo com cURL" value={curlExample} onCopy={onCopy} />
          <div className="flex items-start gap-2 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
            <span>A plataforma valida telefone, conexão, template, idioma e parâmetros antes de enfileirar o envio.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CodeBlock({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (value: string) => void;
}) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div className="relative rounded-lg bg-muted p-4">
        <pre className="overflow-x-auto whitespace-pre-wrap text-xs">{value}</pre>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={() => onCopy(value)}
          aria-label={`Copiar ${label}`}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
