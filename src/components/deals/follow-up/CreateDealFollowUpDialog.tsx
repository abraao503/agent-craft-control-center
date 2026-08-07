import { useState } from "react";
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
import { createDealFollowUp } from "@/services/deal/dealFollowUp";
import { Recurrence } from "@/types/deal-follow-up";
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

interface CreateDealFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  dealTitle: string;
  pipelineId: string;
  isMetaCloud: boolean;
}

export const CreateDealFollowUpDialog: React.FC<
  CreateDealFollowUpDialogProps
> = ({
  open,
  onOpenChange,
  dealId,
  dealTitle,
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

  const createMutation = useMutation({
    mutationFn: (data: FormData) => {
      // Convert local datetime to UTC ISO string
      const localDate = new Date(data.scheduledAt);
      const utcDate = localDate.toISOString();

      return createDealFollowUp(dealId, {
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
        description: "Agendamento criado com sucesso.",
      });
      form.reset();
      setSelectedFile(null);
      setRecurrence(undefined);
      setTemplate(undefined);
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      let errorMessage = "Falha ao criar agendamento.";

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

    createMutation.mutate(data);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !createMutation.isPending) {
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Criar Agendamento - {dealTitle}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)] pr-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 p-2"
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
                        disabled={createMutation.isPending}
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
                        disabled={createMutation.isPending}
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
                disabled={createMutation.isPending}
              />}

              {isMetaCloud && (
                <MetaTemplateConfigurator
                  pipelineId={pipelineId}
                  dealId={dealId}
                  value={template}
                  onChange={setTemplate}
                  disabled={createMutation.isPending}
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
                        disabled={createMutation.isPending}
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
                disabled={createMutation.isPending}
              />

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={createMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Criar Agendamento
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
