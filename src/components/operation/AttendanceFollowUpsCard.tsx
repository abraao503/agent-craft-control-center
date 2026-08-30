import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Loader2, Plus, RefreshCw, X } from "lucide-react";
import {
  useOperationalFollowUps,
} from "@/hooks/useOperationalAttendances";
import { useOperationalAttendanceMutations } from "@/hooks/useOperationalAttendanceMutations";
import { getOperationalAttendanceErrorMessage } from "@/utils/operationalAttendanceErrors";
import {
  OperationalFollowUp,
  AttendanceStatus,
} from "@/types/operation-attendance";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const followUpSchema = z.object({
  title: z.string().trim().min(2, "Informe um título com pelo menos 2 caracteres.").max(160),
  scheduledAt: z.string().min(1, "Informe quando o follow-up deve ocorrer."),
  text: z.string().trim().min(2, "Informe uma mensagem com pelo menos 2 caracteres.").max(2000),
});

type FollowUpFormValues = z.infer<typeof followUpSchema>;

const cancelSchema = z.object({
  reason: z.string().trim().max(2000).optional(),
});

type CancelFormValues = z.infer<typeof cancelSchema>;

interface AttendanceFollowUpsCardProps {
  workspaceId: string;
  attendanceId: string;
  expectedVersion: number;
  status: AttendanceStatus;
  canManage: boolean;
}

const EMPTY_VALUES: FollowUpFormValues = {
  title: "",
  scheduledAt: "",
  text: "",
};

export function AttendanceFollowUpsCard({
  workspaceId,
  attendanceId,
  expectedVersion,
  status,
  canManage,
}: AttendanceFollowUpsCardProps) {
  const { toast } = useToast();
  const mutations = useOperationalAttendanceMutations(workspaceId);
  const followUpsQuery = useOperationalFollowUps(workspaceId, attendanceId, {
    page: 1,
    limit: 50,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<OperationalFollowUp | null>(null);
  const [cancelTarget, setCancelTarget] = useState<OperationalFollowUp | null>(null);
  const form = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpSchema),
    defaultValues: EMPTY_VALUES,
  });
  const cancelForm = useForm<CancelFormValues>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: "" },
  });
  const isSaving = mutations.createFollowUp.isPending || mutations.updateFollowUp.isPending;

  const openCreate = () => {
    setEditingFollowUp(null);
    form.reset(EMPTY_VALUES);
    setDialogOpen(true);
  };

  const openEdit = (followUp: OperationalFollowUp) => {
    if (followUp.content.kind !== "TEXT") return;
    setEditingFollowUp(followUp);
    form.reset({
      title: followUp.title,
      scheduledAt: toLocalDateTime(followUp.schedule.firstRunAt),
      text: followUp.content.text,
    });
    setDialogOpen(true);
  };

  const submitFollowUp = async (values: FollowUpFormValues) => {
    const schedule = {
      kind: "ONCE" as const,
      firstRunAt: toIsoDateTime(values.scheduledAt),
    };
    const content = { kind: "TEXT" as const, text: values.text.trim() };
    try {
      if (editingFollowUp) {
        await mutations.updateFollowUp.mutateAsync({
          attendanceId,
          followUpId: editingFollowUp.id,
          expectedVersion,
          title: values.title.trim(),
          timezone: getTimeZone(),
          schedule,
          content,
        });
        toast({ title: "Follow-up atualizado", description: "O próximo disparo foi reagendado." });
      } else {
        await mutations.createFollowUp.mutateAsync({
          attendanceId,
          expectedVersion,
          title: values.title.trim(),
          timezone: getTimeZone(),
          schedule,
          content,
        });
        toast({ title: "Follow-up criado", description: "O follow-up foi incluído neste atendimento." });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: editingFollowUp ? "Não foi possível atualizar" : "Não foi possível criar",
        description: getOperationalAttendanceErrorMessage(error, "Atualize o atendimento e tente novamente."),
        variant: "destructive",
      });
    }
  };

  const submitCancel = async (values: CancelFormValues) => {
    if (!cancelTarget) return;
    try {
      await mutations.cancelFollowUp.mutateAsync({
        attendanceId,
        followUpId: cancelTarget.id,
        expectedVersion,
        reason: values.reason?.trim() || undefined,
      });
      toast({ title: "Follow-up cancelado", description: "O próximo disparo não será enviado." });
      setCancelTarget(null);
      cancelForm.reset({ reason: "" });
    } catch (error) {
      toast({
        title: "Não foi possível cancelar",
        description: getOperationalAttendanceErrorMessage(error, "Atualize o atendimento e tente novamente."),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4 text-primary" />
                Follow-ups
              </CardTitle>
              <CardDescription>Agendamentos vinculados ao ciclo atual.</CardDescription>
            </div>
            <Button size="sm" onClick={openCreate} disabled={!canManage || status !== "PENDING"}>
              <Plus className="mr-2 h-4 w-4" />
              Novo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {followUpsQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível carregar os follow-ups</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center gap-3">
                {getOperationalAttendanceErrorMessage(followUpsQuery.error, "Tente atualizar a lista.")}
                <Button variant="outline" size="sm" onClick={() => void followUpsQuery.refetch()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar
                </Button>
              </AlertDescription>
            </Alert>
          ) : followUpsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando follow-ups…
            </div>
          ) : followUpsQuery.data?.items.length ? (
            <div className="space-y-3">
              {followUpsQuery.data.items.map((followUp) => (
                <FollowUpRow
                  key={followUp.id}
                  followUp={followUp}
                  canManage={canManage && status === "PENDING"}
                  onEdit={() => openEdit(followUp)}
                  onCancel={() => {
                    cancelForm.reset({ reason: "" });
                    setCancelTarget(followUp);
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum follow-up agendado para este ciclo.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submitFollowUp)} className="space-y-5">
              <DialogHeader>
                <DialogTitle>{editingFollowUp ? "Editar follow-up" : "Novo follow-up"}</DialogTitle>
                <DialogDescription>
                  O disparo usa o canal operacional configurado para este atendimento.
                </DialogDescription>
              </DialogHeader>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl><Input {...field} placeholder="Ex.: Retornar contato" disabled={isSaving} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data e hora</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} disabled={isSaving} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem</FormLabel>
                    <FormControl><Textarea {...field} placeholder="Mensagem que será enviada" disabled={isSaving} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingFollowUp ? "Salvar alterações" : "Agendar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="sm:max-w-[460px]">
          <Form {...cancelForm}>
            <form onSubmit={cancelForm.handleSubmit(submitCancel)} className="space-y-5">
              <DialogHeader>
                <DialogTitle>Cancelar follow-up</DialogTitle>
                <DialogDescription>O agendamento será cancelado e não terá novo disparo.</DialogDescription>
              </DialogHeader>
              <FormField
                control={cancelForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo (opcional)</FormLabel>
                    <FormControl><Textarea {...field} placeholder="Adicione contexto para a timeline" disabled={mutations.cancelFollowUp.isPending} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCancelTarget(null)} disabled={mutations.cancelFollowUp.isPending}>Voltar</Button>
                <Button type="submit" variant="destructive" disabled={mutations.cancelFollowUp.isPending}>
                  {mutations.cancelFollowUp.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                  Cancelar follow-up
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FollowUpRow({
  followUp,
  canManage,
  onEdit,
  onCancel,
}: {
  followUp: OperationalFollowUp;
  canManage: boolean;
  onEdit: () => void;
  onCancel: () => void;
}) {
  const canEdit = followUp.status === "ACTIVE" && followUp.content.kind === "TEXT";
  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{followUp.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {followUp.nextRunAt ? `Próximo disparo: ${formatDateTime(followUp.nextRunAt)}` : "Sem próximo disparo"}
          </p>
        </div>
        <Badge variant={getFollowUpVariant(followUp.status)}>{getFollowUpLabel(followUp.status)}</Badge>
      </div>
      {followUp.content.kind === "TEXT" ? (
        <p className="mt-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">{followUp.content.text}</p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Conteúdo {followUp.content.kind.toLowerCase()}.</p>
      )}
      {canManage && followUp.status === "ACTIVE" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {canEdit ? <Button size="sm" variant="outline" onClick={onEdit}>Editar</Button> : null}
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onCancel}>Cancelar</Button>
        </div>
      ) : null}
    </div>
  );
}

function getTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString();
}

function toLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function getFollowUpLabel(status: OperationalFollowUp["status"]) {
  if (status === "ACTIVE") return "Ativo";
  if (status === "PAUSED") return "Pausado";
  if (status === "COMPLETED") return "Concluído";
  return "Cancelado";
}

function getFollowUpVariant(status: OperationalFollowUp["status"]): "default" | "secondary" | "destructive" | "outline" {
  if (status === "ACTIVE") return "default";
  if (status === "CANCELLED") return "destructive";
  if (status === "COMPLETED") return "outline";
  return "secondary";
}
