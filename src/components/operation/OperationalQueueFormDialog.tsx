import { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ServiceQueue } from "@/types/operation";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const queueFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe um nome para a fila.")
    .max(160, "O nome deve ter no máximo 160 caracteres."),
  description: z
    .string()
    .max(500, "A descrição deve ter no máximo 500 caracteres."),
});

export type OperationalQueueFormValues = z.infer<typeof queueFormSchema>;

type OperationalQueueFormDialogProps = {
  open: boolean;
  queue: ServiceQueue | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: OperationalQueueFormValues) => Promise<void>;
};

export function OperationalQueueFormDialog({
  open,
  queue,
  isPending,
  onOpenChange,
  onSubmit,
}: OperationalQueueFormDialogProps) {
  const form = useForm<OperationalQueueFormValues>({
    resolver: zodResolver(queueFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: queue?.name ?? "",
        description: queue?.description ?? "",
      });
    }
  }, [form, open, queue]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isPending) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{queue ? "Editar fila" : "Nova fila"}</DialogTitle>
          <DialogDescription>
            Informe um nome único entre as filas ativas desta área.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit({
              name: values.name.trim(),
              description: values.description.trim(),
            });
          })}
        >
          <div className="space-y-2">
            <Label htmlFor="operational-queue-name">Nome *</Label>
            <Input
              id="operational-queue-name"
              autoFocus
              maxLength={160}
              disabled={isPending}
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="operational-queue-description">Descrição</Label>
            <Textarea
              id="operational-queue-description"
              maxLength={500}
              disabled={isPending}
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
