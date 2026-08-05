import { Webhook, Copy } from "lucide-react";
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
import type { DealWebhook } from "@/types/deal-webhook";

interface DealWebhookDocumentationProps {
  webhook: DealWebhook;
  onCopy: (text: string) => void;
}

const examplePayload = {
  title: "Nome do negócio",
  description: "Descrição opcional do negócio",
  value: 1000,
  customerName: "João Silva",
  customerPhone: "+5511999887766",
  customerEmail: "joao.silva@exemplo.com",
};

const headersPayload = { "Content-Type": "application/json" };

export function DealWebhookDocumentation({
  webhook,
  onCopy,
}: DealWebhookDocumentationProps) {
  const curlExample = `curl -X POST "${webhook.webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(examplePayload)}'`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            URL do Webhook
          </CardTitle>
          <CardDescription>
            Use esta URL para enviar requisições e criar negócios
            automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Endpoint</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
                {webhook.webhookUrl}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onCopy(webhook.webhookUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Método HTTP</Label>
            <div className="mt-1">
              <code className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-semibold">
                POST
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentação da API</CardTitle>
          <CardDescription>
            Exemplo de como fazer uma requisição para este webhook
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock
            label="Headers"
            value={JSON.stringify(headersPayload, null, 2)}
            onCopy={onCopy}
          />
          <CodeBlock
            label="Body (JSON)"
            value={JSON.stringify(examplePayload, null, 2)}
            onCopy={onCopy}
          />

          <Separator />

          <div>
            <Label className="text-sm font-medium mb-2 block">
              Campos do Body
            </Label>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3 gap-2 p-2 bg-muted/50 rounded font-medium">
                <span>Campo</span>
                <span>Tipo</span>
                <span>Obrigatório</span>
              </div>
              <BodyField name="title" type="string" required />
              <BodyField
                name="customerPhone"
                type="string (formato internacional)"
                required
                muted
              />
              <BodyField name="description" type="string" />
              <BodyField name="value" type="number" muted />
              <BodyField name="customerName" type="string" />
              <BodyField name="customerEmail" type="email" muted />
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium mb-2 block">
              Observações Importantes
            </Label>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>
                O telefone aceita formato internacional com DDI (ex:
                +5511999887766, +16505551234). Números sem DDI são assumidos
                como brasileiros.
              </li>
              <li>
                O campo <InlineCode>title</InlineCode> é obrigatório e será o
                nome do negócio
              </li>
              <li>
                O campo <InlineCode>customerPhone</InlineCode> é obrigatório
              </li>
              <li>Todos os outros campos são opcionais</li>
              <li>
                A pipeline e etapa são configuradas no webhook e aplicadas
                automaticamente
              </li>
            </ul>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">
              Configuração do Webhook
            </Label>
            <div className="space-y-2 text-sm">
              <InfoRow label="Pipeline" value={webhook.pipeline.name} />
              <InfoRow
                label="Etapa"
                value={webhook.stage?.name || "Primeira etapa da pipeline"}
              />
            </div>
          </div>

          <Separator />

          <CodeBlock label="Exemplo com cURL" value={curlExample} onCopy={onCopy} />

          <div>
            <Label className="text-sm font-medium mb-2 block">
              Resposta de Sucesso (202 Accepted)
            </Label>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(
                  {
                    success: true,
                    data: {
                      executionId: "uuid",
                      message: "Webhook received and queued for processing",
                    },
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
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
  onCopy: (text: string) => void;
}) {
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">{label}</Label>
      <div className="bg-muted p-4 rounded-lg relative">
        <pre className="text-sm overflow-x-auto whitespace-pre-wrap">{value}</pre>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={() => onCopy(value)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function BodyField({
  name,
  type,
  required = false,
  muted = false,
}: {
  name: string;
  type: string;
  required?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={`grid grid-cols-3 gap-2 p-2 ${muted ? "bg-muted/30" : ""}`}>
      <code>{name}</code>
      <span>{type}</span>
      <span className={required ? "text-green-600" : "text-muted-foreground"}>
        {required ? "Sim" : "Não"}
      </span>
    </div>
  );
}

function InlineCode({ children }: { children: string }) {
  return <code className="text-xs bg-muted px-1 py-0.5 rounded">{children}</code>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
