import { useState } from "react";
import { Copy, KeyRound, Radio } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";

const agentRequest = {
  message: {
    type: "text",
    text: "Mensagem recebida do contato",
  },
  phone: "<telefone do contato>",
  context: {
    atendimento_id: "<id do atendimento>",
  },
};

const agentResponse = {
  context: {
    atendimento_id: "<o mesmo id do atendimento>",
  },
  messages: [{ text: "Olá! Como posso ajudar?" }],
  status: "CONVERSATION",
};

const callbackPayload = {
  context: {
    atendimento_id: "<id recebido pela Clara>",
  },
  messages: [{ text: "Como não recebemos resposta, encerramos o atendimento." }],
  status: "ENCERRADO",
};

const callbackPath = "/operation/triage-agents/callback";

interface Props {
  onCopy: (value: string) => void;
}

export function OperationalTriageAgentDocumentation({ onCopy }: Props) {
  const [apiBaseUrl, setApiBaseUrl] = useState(api.defaults.baseURL ?? "");
  const normalizedApiBaseUrl = apiBaseUrl.trim().replace(/\/+$/, "");
  const callbackUrl = `${normalizedApiBaseUrl}${callbackPath}`;
  const callbackCurl = `curl -X POST "${callbackUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: $CLARA_API_KEY" \\
  -H "Idempotency-Key: $CALLBACK_ID" \\
  -d '${JSON.stringify(callbackPayload, null, 2)}'`;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Plataforma → agente
            </CardTitle>
            <CardDescription>
              A cada mensagem recebida, a plataforma envia o conteúdo e o contexto
              para o endpoint do agente, acrescentando <code>/mensagem</code> à URL cadastrada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span><strong className="text-foreground">Método:</strong> POST</span>
              <span><strong className="text-foreground">Endpoint:</strong> URL cadastrada + /mensagem</span>
            </div>
            <CodeBlock
              label="Headers enviados"
              value={'Authorization: <credencial cadastrada>\nContent-Type: application/json'}
              onCopy={onCopy}
            />
            <CodeBlock
              label="Corpo enviado"
              value={JSON.stringify(agentRequest, null, 2)}
              onCopy={onCopy}
            />
            <CodeBlock
              label="Resposta esperada"
              value={JSON.stringify(agentResponse, null, 2)}
              onCopy={onCopy}
            />
            <p className="text-sm text-muted-foreground">
              <code>message.type</code> pode ser <code>text</code>, <code>media</code> ou <code>audio</code>.
              O <code>atendimento_id</code> deve voltar sem alteração em <code>context</code>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Agente → plataforma
            </CardTitle>
            <CardDescription>
              Use o callback para enviar mensagens proativas e, quando necessário,
              encerrar o atendimento sem esperar outra mensagem do cliente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="triage-agent-api-base-url">URL base da API</Label>
              <Input
                id="triage-agent-api-base-url"
                className="mt-1"
                value={apiBaseUrl}
                onChange={(event) => setApiBaseUrl(event.target.value)}
                placeholder="https://api.exemplo.com"
                autoComplete="url"
                spellCheck={false}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Preenchida com a URL configurada no painel. A Clara precisa conseguir acessar esse endereço.
              </p>
            </div>
            <div>
              <Label>Endpoint do callback</Label>
              <div className="mt-1 flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded bg-muted px-3 py-2 text-sm">
                  POST {callbackUrl || callbackPath}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onCopy(`POST ${callbackUrl || callbackPath}`)}
                  aria-label="Copiar endpoint do callback"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span><strong className="text-foreground">Autorização:</strong> X-API-Key</span>
              <span><strong className="text-foreground">Obrigatório:</strong> Idempotency-Key</span>
            </div>
            <CodeBlock label="Exemplo cURL" value={callbackCurl} onCopy={onCopy} />
            <p className="text-sm text-muted-foreground">
              Use o <code>context.atendimento_id</code> recebido em <code>/mensagem</code>;
              ele identifica o atendimento, não o telefone.
            </p>
            <CodeBlock
              label="Resposta de sucesso"
              value={JSON.stringify(
                {
                  atendimento_id: "<id do atendimento>",
                  status: "ENCERRADO",
                  sentMessageCount: 1,
                  duplicate: false,
                },
                null,
                2,
              )}
              onCopy={onCopy}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <h3 className="font-medium text-foreground">Chaves e estados</h3>
          A credencial de saída autentica chamadas da plataforma para o agente;
          a chave de callback autentica chamadas do agente para a plataforma e só
          aparece ao criar ou rotacionar. <strong>CONVERSATION</strong> envia as
          mensagens e mantém o atendimento aberto; <strong>ENCERRADO</strong> envia
          as mensagens e fecha o atendimento. Ambos exigem ao menos uma mensagem.
          Para transferir para humanos, responda <strong>TRANSFER</strong> na chamada
          síncrona: a área e a fila vêm da rota do canal. Reutilize a chave de
          idempotência somente ao repetir a mesma operação.
        </div>
      </div>
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
    <div className="min-w-0">
      <Label className="mb-2 block">{label}</Label>
      <div className="relative rounded-lg bg-muted p-4 pr-12">
        <pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs">{value}</pre>
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
