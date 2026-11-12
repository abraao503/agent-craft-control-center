import { useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  KeyRound,
  Loader2,
  RefreshCw,
  RotateCw,
  Trash2,
} from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatOperationalDateTime } from "@/components/operation/operationalChannelLabels";
import { useOperationalTriageAgentCallbackKey } from "@/hooks/useOperationalTriageAgentCallbackKey";
import { useToast } from "@/hooks/use-toast";
import { OperationalTriageAgent } from "@/types/operation-triage-agent";
import { getOperationalTriageAgentErrorMessage } from "@/utils/operationalTriageAgentErrors";

export function OperationalTriageAgentCallbackKey({
  agent,
}: {
  agent: OperationalTriageAgent;
}) {
  const { toast } = useToast();
  const [secret, setSecret] = useState<string | null>(null);
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const { query, create, rotate, revoke } =
    useOperationalTriageAgentCallbackKey({
      workspaceId: agent.workspaceId,
      agentId: agent.id,
    });
  const isPending = create.isPending || rotate.isPending || revoke.isPending;

  const clearSecret = () => {
    setSecret(null);
    setSecretDialogOpen(false);
    create.reset();
    rotate.reset();
  };

  const issueKey = async (action: "create" | "rotate") => {
    try {
      const result =
        action === "create"
          ? await create.mutateAsync({
              workspaceId: agent.workspaceId,
              agentId: agent.id,
            })
          : await rotate.mutateAsync({
              workspaceId: agent.workspaceId,
              agentId: agent.id,
            });
      setSecret(result.secret);
      setSecretDialogOpen(true);
      toast({
        title:
          action === "create"
            ? "Chave de callback criada"
            : "Chave de callback rotacionada",
        description:
          "Copie e guarde o segredo agora. Ele não poderá ser consultado novamente.",
      });
    } catch (error) {
      toast({
        title:
          action === "create"
            ? "Não foi possível criar a chave"
            : "Não foi possível rotacionar a chave",
        description: getOperationalTriageAgentErrorMessage(
          error,
          "Tente novamente em instantes.",
        ),
        variant: "destructive",
      });
    }
  };

  const handleRevoke = async () => {
    setRevokeDialogOpen(false);
    try {
      await revoke.mutateAsync({
        workspaceId: agent.workspaceId,
        agentId: agent.id,
      });
      toast({
        title: "Chave de callback revogada",
        description: "A Clara não poderá mais autenticar chamadas com essa chave.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível revogar a chave",
        description: getOperationalTriageAgentErrorMessage(
          error,
          "Tente novamente em instantes.",
        ),
        variant: "destructive",
      });
    }
  };

  const handleCopy = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      toast({ title: "Chave copiada" });
    } catch {
      toast({
        title: "Não foi possível copiar automaticamente",
        description: "Selecione o conteúdo da chave e copie manualmente.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="space-y-3 rounded-md border bg-muted/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="h-4 w-4 text-primary" />
            Chave de callback da Clara
          </h3>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Chave usada pela Clara para chamar a plataforma. É separada da
            credencial de saída usada pela plataforma para chamar o agente.
          </p>
        </div>
        {query.data?.configured ? (
          <Badge variant="secondary">Configurada</Badge>
        ) : query.isSuccess ? (
          <Badge variant="outline">Não configurada</Badge>
        ) : null}
      </div>

      {query.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando status da chave de callback
        </div>
      ) : query.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível consultar a chave</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {getOperationalTriageAgentErrorMessage(
              query.error,
              "Verifique sua permissão e tente novamente.",
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : query.data?.configured ? (
        <p className="text-xs text-muted-foreground">
          Prefixo {query.data.keyPrefix}
          {query.data.createdAt
            ? ` · criada em ${formatOperationalDateTime(query.data.createdAt)}`
            : ""}
          . O segredo completo não pode ser recuperado.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Crie uma chave para permitir que a Clara envie mensagens ou encerre
          atendimentos por callback.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {query.isSuccess && !query.data.configured ? (
          <Button
            size="sm"
            onClick={() => void issueKey("create")}
            disabled={isPending}
          >
            {create.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Criar chave de callback
          </Button>
        ) : null}
        {query.isSuccess && query.data.configured ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRotateDialogOpen(true)}
              disabled={isPending}
            >
              {rotate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCw className="h-4 w-4" />
              )}
              Rotacionar chave
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setRevokeDialogOpen(true)}
              disabled={isPending}
            >
              {revoke.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Revogar
            </Button>
          </>
        ) : null}
      </div>

      <Dialog
        open={secretDialogOpen}
        onOpenChange={(open) => {
          if (!open) clearSecret();
          else setSecretDialogOpen(true);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Guarde a chave de callback
            </DialogTitle>
            <DialogDescription>
              Este é o único momento em que o segredo completo será exibido. Ao
              fechar esta janela, ele será removido da tela.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor={`callback-key-${agent.id}`} className="text-sm font-medium">
            Chave de callback
          </label>
          <Input
            id={`callback-key-${agent.id}`}
            value={secret ?? ""}
            readOnly
            autoComplete="off"
            spellCheck={false}
            onFocus={(event) => event.currentTarget.select()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => void handleCopy()} disabled={!secret}>
              <Copy className="h-4 w-4" />
              Copiar chave
            </Button>
            <Button onClick={clearSecret}>
              <Check className="h-4 w-4" />
              Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={rotateDialogOpen} onOpenChange={setRotateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotacionar chave de callback?</AlertDialogTitle>
            <AlertDialogDescription>
              A chave atual deixará de funcionar. A nova chave será exibida uma
              única vez e precisará ser atualizada na Clara.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                setRotateDialogOpen(false);
                void issueKey("rotate");
              }}
              disabled={isPending}
            >
              {isPending ? "Rotacionando..." : "Rotacionar chave"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar chave de callback?</AlertDialogTitle>
            <AlertDialogDescription>
              A Clara perderá acesso imediato ao callback. Para voltar a usar a
              integração, será preciso criar uma nova chave e configurá-la na
              Clara.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleRevoke();
              }}
              disabled={isPending}
            >
              {isPending ? "Revogando..." : "Revogar chave"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
