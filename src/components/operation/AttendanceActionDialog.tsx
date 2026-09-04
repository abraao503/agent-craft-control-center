import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AttendanceDetail,
  AttendanceOptions,
} from "@/types/operation-attendance";

export type AttendanceAction =
  | "ROUTE"
  | "ASSIGN"
  | "TRANSFER"
  | "PENDING"
  | "RESUME"
  | "UNASSIGN"
  | "CLOSE";

const attendanceActionSchema = z.object({
  targetAreaId: z.string().optional(),
  targetQueueId: z.string().optional(),
  targetUserId: z.string().optional(),
  reason: z.string().trim().max(2000, "Use no máximo 2.000 caracteres.").optional(),
  pendingDueAt: z.string().optional(),
  includeFollowUp: z.boolean().optional(),
  followUpTitle: z.string().trim().max(160, "Use no máximo 160 caracteres.").optional(),
  followUpAt: z.string().optional(),
  followUpText: z.string().trim().max(2000, "Use no máximo 2.000 caracteres.").optional(),
  closeSummary: z
    .string()
    .trim()
    .max(2000, "Use no máximo 2.000 caracteres.")
    .optional(),
});

export type AttendanceActionFormValues = z.infer<
  typeof attendanceActionSchema
>;

interface AttendanceActionDialogProps {
  open: boolean;
  action: AttendanceAction | null;
  attendance: Pick<
    AttendanceDetail,
    "id" | "targetAreaId" | "targetQueueId"
  >;
  options?: AttendanceOptions;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AttendanceActionFormValues) => void;
}

const DEFAULT_VALUES: AttendanceActionFormValues = {
  targetAreaId: "",
  targetQueueId: "",
  targetUserId: "",
  reason: "",
  pendingDueAt: "",
  includeFollowUp: false,
  followUpTitle: "",
  followUpAt: "",
  followUpText: "",
  closeSummary: "",
};

const ACTION_COPY: Record<
  AttendanceAction,
  { title: string; description: string; submit: string }
> = {
  ROUTE: {
    title: "Encaminhar atendimento",
    description: "Escolha a área e a fila de destino para este ciclo.",
    submit: "Encaminhar",
  },
  ASSIGN: {
    title: "Atribuir atendimento",
    description: "A atribuição direta coloca o atendimento em andamento.",
    submit: "Atribuir",
  },
  TRANSFER: {
    title: "Transferir atendimento",
    description: "O ciclo e a conversa permanecem os mesmos após a transferência.",
    submit: "Transferir",
  },
  PENDING: {
    title: "Marcar como pendente",
    description: "Informe o motivo e, se necessário, programe prazo e follow-up.",
    submit: "Marcar pendente",
  },
  RESUME: {
    title: "Retomar atendimento",
    description: "O atendimento voltará para Em atendimento.",
    submit: "Retomar",
  },
  UNASSIGN: {
    title: "Remover responsável",
    description: "O atendimento continuará no destino sem operador atribuído.",
    submit: "Remover responsável",
  },
  CLOSE: {
    title: "Encerrar atendimento",
    description: "O resumo é obrigatório e o ciclo não poderá ser reaberto.",
    submit: "Encerrar atendimento",
  },
};

export function AttendanceActionDialog({
  open,
  action,
  attendance,
  options,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: AttendanceActionDialogProps) {
  const form = useForm<AttendanceActionFormValues>({
    resolver: zodResolver(attendanceActionSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const selectedAreaId = form.watch("targetAreaId");
  const includeFollowUp = form.watch("includeFollowUp");
  const selectedArea = options?.areas.find((area) => area.id === selectedAreaId);
  const copy = action ? ACTION_COPY[action] : ACTION_COPY.PENDING;

  const availableQueues = useMemo(
    () => selectedArea?.queues.filter((queue) => queue.active) ?? [],
    [selectedArea],
  );

  useEffect(() => {
    if (open) {
      form.reset({
        ...DEFAULT_VALUES,
        targetAreaId: attendance.targetAreaId ?? "",
        targetQueueId: attendance.targetQueueId ?? "",
      });
    }
  }, [attendance.id, attendance.targetAreaId, attendance.targetQueueId, form, open]);

  if (!action) return null;

  const setFieldError = (field: keyof AttendanceActionFormValues, message: string) => {
    form.setError(field, { type: "manual", message });
  };

  const handleValidSubmit = (values: AttendanceActionFormValues) => {
    if (action === "ROUTE" || action === "TRANSFER") {
      if (!values.targetAreaId) {
        setFieldError("targetAreaId", "Selecione uma área.");
        return;
      }
      if (!values.targetQueueId) {
        setFieldError("targetQueueId", "Selecione uma fila.");
        return;
      }
    }

    if (action === "ASSIGN" && !values.targetUserId) {
      setFieldError("targetUserId", "Selecione um responsável.");
      return;
    }

    if (action === "PENDING") {
      if (!values.reason?.trim() || values.reason.trim().length < 2) {
        setFieldError("reason", "Informe um motivo com pelo menos 2 caracteres.");
        return;
      }
      if (includeFollowUp) {
        if (!values.followUpTitle?.trim() || values.followUpTitle.trim().length < 2) {
          setFieldError("followUpTitle", "Informe um título para o follow-up.");
          return;
        }
        if (!values.followUpAt) {
          setFieldError("followUpAt", "Informe quando o follow-up deve ocorrer.");
          return;
        }
        if (!values.followUpText?.trim() || values.followUpText.trim().length < 2) {
          setFieldError("followUpText", "Informe o conteúdo do follow-up.");
          return;
        }
      }
    }

    if (action === "CLOSE" && (!values.closeSummary?.trim() || values.closeSummary.trim().length < 2)) {
      setFieldError("closeSummary", "Informe um resumo com pelo menos 2 caracteres.");
      return;
    }

    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleValidSubmit)} className="space-y-6">
            <DialogHeader>
              <DialogTitle>{copy.title}</DialogTitle>
              <DialogDescription>{copy.description}</DialogDescription>
            </DialogHeader>

            {action === "ROUTE" || action === "TRANSFER" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="targetAreaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área de destino</FormLabel>
                      <Select
                        value={field.value || undefined}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("targetQueueId", "");
                        }}
                        disabled={isSubmitting || !options}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a área" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {options?.areas
                            .filter((area) => area.active)
                            .map((area) => (
                              <SelectItem key={area.id} value={area.id}>
                                {area.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetQueueId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fila de destino</FormLabel>
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                        disabled={isSubmitting || !selectedArea}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a fila" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableQueues.map((queue) => (
                            <SelectItem key={queue.id} value={queue.id}>
                              {queue.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}

            {action === "ASSIGN" ? (
              <FormField
                control={form.control}
                name="targetUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      disabled={isSubmitting || !options}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um operador" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {options?.users
                          .filter((user) => user.active)
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {action === "TRANSFER" && options?.capabilities.canTransferToUser ? (
              <FormField
                control={form.control}
                name="targetUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável (opcional)</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={(value) => field.onChange(value === "QUEUE_ONLY" ? "" : value)}
                      disabled={isSubmitting || !options}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Deixar na fila" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="QUEUE_ONLY">Deixar na fila</SelectItem>
                        {options.users
                          .filter((user) => user.active)
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {action === "PENDING" ? (
              <>
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Por que este atendimento ficará pendente?" disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pendingDueAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo para revisão (opcional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>O prazo é convertido para o fuso local do operador.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <input
                      id="include-follow-up"
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-input"
                      {...form.register("includeFollowUp")}
                      disabled={isSubmitting}
                    />
                    <div>
                      <Label htmlFor="include-follow-up">Programar follow-up junto com a pendência</Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Será criado um follow-up de texto único na mesma operação.
                      </p>
                    </div>
                  </div>
                  {includeFollowUp ? (
                    <div className="mt-4 space-y-4 border-t pt-4">
                      <FormField
                        control={form.control}
                        name="followUpTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título do follow-up</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ex.: Retornar contato" disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="followUpAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quando enviar</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="followUpText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mensagem</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Texto que será enviado no follow-up" disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}

            {action === "CLOSE" ? (
              <FormField
                control={form.control}
                name="closeSummary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resumo do encerramento</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Registre o resultado do atendimento" disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {action === "RESUME" || action === "UNASSIGN" || action === "TRANSFER" || action === "ROUTE" ? (
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo (opcional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Adicione contexto para a timeline" disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" variant={action === "CLOSE" ? "destructive" : "default"} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {copy.submit}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
