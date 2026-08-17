import { format } from "date-fns";
import { enUS, es, ptBR } from "date-fns/locale";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DealWebhookStatusBadge } from "@/components/deal-webhooks/DealWebhookStatusBadge";
import {
  getErrorTranslation,
  getStatusTranslation,
  parseErrorMessage,
} from "@/components/deal-webhooks/dealWebhookDetails";
import type { DealWebhookExecution } from "@/types/deal-webhook";
import { useAppLocale } from "@/i18n/LocaleProvider";

interface DealWebhookExecutionDialogProps {
  open: boolean;
  execution: DealWebhookExecution | null;
  technicalDetailsOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTechnicalDetailsChange: (open: boolean) => void;
}

export function DealWebhookExecutionDialog({
  open,
  execution,
  technicalDetailsOpen,
  onOpenChange,
  onTechnicalDetailsChange,
}: DealWebhookExecutionDialogProps) {
  const { locale } = useAppLocale();
  const dateLocale = locale === "es-ES" ? es : locale === "en-US" ? enUS : ptBR;
  const datePattern = locale === "es-ES" ? "dd/MM/yyyy 'a las' HH:mm:ss" : "dd/MM/yyyy 'às' HH:mm:ss";

  const parsedError = execution?.errorMessage
    ? parseErrorMessage(execution.errorMessage)
    : null;
  const errorTranslation = parsedError
    ? getErrorTranslation(parsedError.code)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Detalhes da Execução
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre o processamento desta requisição
          </DialogDescription>
        </DialogHeader>

        {execution && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <div className="flex items-center gap-2">
                <DealWebhookStatusBadge status={execution.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {getStatusTranslation(execution.status).description}
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-medium">Data e Hora</Label>
              <p className="text-sm">
                {format(execution.createdAt, datePattern, {
                  locale: dateLocale,
                })}
              </p>
            </div>

            {parsedError && (
              <>
                <Separator />
                {errorTranslation && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      O que aconteceu?
                    </Label>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        {errorTranslation.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {errorTranslation.description}
                      </p>
                    </div>
                  </div>
                )}

                <Collapsible
                  open={technicalDetailsOpen}
                  onOpenChange={onTechnicalDetailsChange}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex items-center gap-2 text-sm">
                        Detalhes Técnicos
                      </span>
                      {technicalDetailsOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Código:
                        </span>
                        <p className="text-sm font-mono text-destructive">
                          {parsedError.code}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Mensagem:
                        </span>
                        <p className="text-sm font-mono break-words">
                          {parsedError.message}
                        </p>
                      </div>
                      {Object.keys(parsedError.metadata).length > 0 && (
                        <div>
                          <span className="text-xs text-muted-foreground">
                            Informações Adicionais:
                          </span>
                          <pre className="text-xs font-mono mt-1 overflow-x-auto">
                            {JSON.stringify(parsedError.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
