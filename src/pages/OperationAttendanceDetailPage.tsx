import { Link, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, MessageSquare } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OperationAttendanceDetailPage() {
  const { attendanceId } = useParams<{ attendanceId: string }>();

  if (!attendanceId) {
    return (
      <section className="mx-auto w-full max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atendimento não informado</AlertTitle>
          <AlertDescription>
            Volte para a inbox e selecione um atendimento válido.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <Link
          to="/operation/attendances"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para atendimentos
        </Link>
        <p className="mt-6 text-sm font-medium uppercase tracking-wide text-primary">
          Operação / atendimento humano
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Detalhe do atendimento
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Atendimento selecionado
          </CardTitle>
          <CardDescription>
            A rota preserva a seleção para a composição do detalhe operacional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-muted/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              ID do atendimento
            </p>
            <p className="mt-2 break-all font-mono text-sm">{attendanceId}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            O detalhe, a conversa e as ações humanas serão conectados às
            consultas e comandos operacionais nas próximas fatias de E5.
          </p>
          <Link
            to="/operation/attendances"
            className={buttonVariants({ variant: "outline" })}
          >
            Voltar para a inbox
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}
