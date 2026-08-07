import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { updateDealFollowUp } from "@/services/deal/dealFollowUp";
import { DealFollowUp, Recurrence } from "@/types/deal-follow-up";
import { Loader2 } from "lucide-react";
import { RecurrenceSelector } from "./RecurrenceSelector";
import { MediaAttachment } from "./MediaAttachment";
import { getFollowUpErrorMessage } from "./errorMessages";
import {
  MetaTemplateConfigurator,
  MetaTemplateConfigValue,
} from "@/components/message-template";

// Schema de validação
const formSchema = z.object({
  title: z
    .string()
    .min(1, "Título é obrigatório")
    .max(255, "Título deve ter no máximo 255 caracteres"),
  message: z.string().optional(),
  scheduledAt: z.string().min(1, "Data e hora são obrigatórias"),
});

type FormData = z.infer<typeof formSchema>;

interface EditDealFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  followUp: DealFollowUp | null;
  pipelineId: string;
  isMetaCloud: boolean;
}

export const EditDealFollowUpDialog: React.FC<EditDealFollowUpDialogProps> = ({
  open,
  onOpenChange,
  dealId,
  followUp,
  pipelineId,
  isMetaCloud,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recurrence, setRecurrence] = useState<Recurrence | undefined>(
    undefined,
  );
  const [template, setTemplate] = useState<MetaTemplateConfigValue>();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      message: "",
      scheduledAt: "",
    },
  });

  // Update form when followUp changes
  useEffect(() => {
    if (followUp) {
      // Convert UTC ISO string to local datetime-local format
      const scheduledDate = new Date(followUp.scheduledAt);
      const year = scheduledDate.getFullYear();
      const month = String(scheduledDate.getMonth() + 1).padStart(2, "0");
      const day = String(scheduledDate.getDate()).padStart(2, "0");
      const hours = String(scheduledDate.getHours()).padStart(2, "0");
      const minutes = String(scheduledDate.getMinutes()).padStart(2, "0");
      const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

      form.reset({
        title: followUp.title,
        message: followUp.message,
        scheduledAt: localDateTime,
      });

      // Restore recurrence and media state
      setRecurrence(followUp.recurrence ?? undefined);
      setTemplate(
        followUp.metaTemplateId
          ? {
              templateId: followUp.metaTemplateId,
              language: followUp.metaTemplateLanguage ?? "",
              bindings: (followUp.metaTemplateBindings ?? {}) as never,
            }
          : undefined,
      );
      setSelectedFile(null);
    }
  }, [followUp, form]);

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => {
      if (!followUp) throw new Error("Follow-up não encontrado");

      // Convert local datetime to UTC ISO string
      const localDate = new Date(data.scheduledAt);
      const utcDate = localDate.toISOString();

      return updateDealFollowUp(dealId, followUp.id, {
        title: data.title,
        message: data.message ?? "",
        scheduledAt: utcDate,
        file: selectedFile ?? undefined,
        recurrence,
        metaTemplateId: template?.templateId,
        metaTemplateLanguage: template?.language,
        metaTemplateBindings: template?.bindings,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dealFollowUps", dealId] });
      toast({
        title: "Sucesso",
        description: "Agendamento atualizado com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      let errorMessage = "Falha ao atualizar agendamento.";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        const apiErrorMessage = axiosError.response?.data?.message;
        if (apiErrorMessage) {
          errorMessage = getFollowUpErrorMessage(apiErrorMessage);
        }
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    // Validate that scheduled date is in the future
    const scheduledDate = new Date(data.scheduledAt);
    const now = new Date();

    if (scheduledDate <= now) {
      toast({
        title: "Data inválida",
        description: "A data agendada deve ser no futuro.",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate(data);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !updateMutation.isPending) {
      form.reset();
      setSelectedFile(null);
      setRecurrence(undefined);
      setTemplate(undefined);
    }
    onOpenChange(open);
  };

  // Get minimum datetime (current datetime + 1 minute)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  if (!followUp) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)] pr-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 pb-2"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Lembrete de Proposta"
                        {...field}
                        disabled={updateMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isMetaCloud && <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite a mensagem que será enviada ao cliente..."
                        rows={4}
                        {...field}
                        disabled={updateMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />}

              {/* Anexo de mídia */}
              {!isMetaCloud && <MediaAttachment
                file={selectedFile}
                onChange={setSelectedFile}
                existingMediaUrl={followUp.mediaUrl}
                existingMediaType={followUp.mediaType}
                disabled={updateMutation.isPending}
              />}

              {isMetaCloud && (
                <MetaTemplateConfigurator
                  pipelineId={pipelineId}
                  dealId={dealId}
                  value={template}
                  onChange={setTemplate}
                  disabled={updateMutation.isPending}
                />
              )}

              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data e Hora Agendada *</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        min={getMinDateTime()}
                        {...field}
                        disabled={updateMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Recorrência */}
              <RecurrenceSelector
                value={recurrence}
                onChange={setRecurrence}
                disabled={updateMutation.isPending}
              />

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
