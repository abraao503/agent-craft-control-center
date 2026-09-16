import { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ServiceArea } from "@/types/operation";
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

const areaFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe um nome para a área.")
    .max(160, "O nome deve ter no máximo 160 caracteres."),
  description: z
    .string()
    .max(500, "A descrição deve ter no máximo 500 caracteres."),
});

export type OperationalAreaFormValues = z.infer<typeof areaFormSchema>;

type OperationalAreaFormDialogProps = {
  open: boolean;
  area: ServiceArea | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: OperationalAreaFormValues) => Promise<void>;
};

export function OperationalAreaFormDialog({
  open,
  area,
  isPending,
  onOpenChange,
  onSubmit,
}: OperationalAreaFormDialogProps) {
  const form = useForm<OperationalAreaFormValues>({
    resolver: zodResolver(areaFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: area?.name ?? "",
        description: area?.description ?? "",
      });
    }
  }, [area, form, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isPending) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{area ? "Editar área" : "Nova área"}</DialogTitle>
          <DialogDescription>
            Informe um nome único entre as áreas ativas deste ambiente.
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
            <Label htmlFor="operational-area-name">Nome *</Label>
            <Input
              id="operational-area-name"
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
            <Label htmlFor="operational-area-description">Descrição</Label>
            <Textarea
              id="operational-area-description"
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
              onClick={() => handleOpenChange(false)}
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
