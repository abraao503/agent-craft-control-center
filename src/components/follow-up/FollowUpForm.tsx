import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FollowUp } from "@/types/follow-up";
import { Tag } from "@/types/tag";
import { listTags } from "@/services/tag/listTags";
import { isColorDark } from "@/lib/utils";
import { MultiSelect } from "@/components/ui/multi-select";

const formSchema = z.object({
  name: z.string().min(3, {
    message: "Nome deve ter pelo menos 3 caracteres",
  }),
  message: z.string().min(10, {
    message: "Mensagem deve ter pelo menos 10 caracteres",
  }),
  inactiveChatTime: z.coerce.number().min(1, {
    message: "Tempo deve ser pelo menos 1 minuto",
  }),
  assistantId: z.string().uuid({
    message: "Assistente inválido",
  }),
  inclusiveTags: z.array(z.string().uuid("Tag ID must be a valid UUID")),
  exclusiveTags: z.array(z.string().uuid("Tag ID must be a valid UUID")),
});

type FormValues = z.infer<typeof formSchema>;

interface FollowUpFormProps {
  initialData?: FollowUp;
  assistants: Array<{ id: string; name: string }>;
  workspaceId: string;
  onSubmit: (data: FormValues & { workspaceId: string }) => void;
  isSubmitting: boolean;
}

export function FollowUpForm({
  initialData,
  assistants,
  workspaceId,
  onSubmit,
  isSubmitting,
}: FollowUpFormProps) {
  // Buscar todas as tags disponíveis
  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["tags", workspaceId],
    queryFn: () => listTags(workspaceId),
    enabled: !!workspaceId,
  });

  // Processando as tags para garantir que sejam arrays de IDs
  let inclusiveTagIds: string[] = [];
  let exclusiveTagIds: string[] = [];

  // Interface para representar tanto string quanto objeto tag
  interface TagLike {
    id: string;
  }

  // Função auxiliar para extrair o ID da tag
  const getTagId = (tag: string | TagLike): string => {
    return typeof tag === "string" ? tag : tag.id;
  };

  if (initialData?.inclusiveTags) {
    // Verifica se inclusiveTags é um array de objetos ou um array de strings
    inclusiveTagIds = Array.isArray(initialData.inclusiveTags)
      ? initialData.inclusiveTags.map(getTagId)
      : [];
  }

  if (initialData?.exclusiveTags) {
    // Verifica se exclusiveTags é um array de objetos ou um array de strings
    exclusiveTagIds = Array.isArray(initialData.exclusiveTags)
      ? initialData.exclusiveTags.map(getTagId)
      : [];
  }

  const defaultValues = initialData
    ? {
        name: initialData.name,
        message: initialData.message,
        inactiveChatTime: initialData.inactiveChatTime,
        assistantId: initialData.assistantId,
        inclusiveTags: inclusiveTagIds,
        exclusiveTags: exclusiveTagIds,
      }
    : {
        name: "",
        message: "",
        inactiveChatTime: 60, // Default: 1 hora
        assistantId: "",
        inclusiveTags: [],
        exclusiveTags: [],
      };

  console.log("defaultValues configurados:", defaultValues);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit({ ...values, workspaceId });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do follow-up" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensagem</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Mensagem que será enviada"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inactiveChatTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tempo de inatividade (minutos)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="Tempo em minutos"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assistantId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assistente</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um assistente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {assistants.map((assistant) => (
                    <SelectItem key={assistant.id} value={assistant.id}>
                      {assistant.name}
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
          name="inclusiveTags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags Inclusivas</FormLabel>
              <FormControl>
                <MultiSelect
                  options={tags.map((tag) => ({
                    value: tag.id,
                    label: tag.name,
                    color: tag.color,
                  }))}
                  placeholder="Selecione as tags inclusivas"
                  selected={field.value}
                  onChange={field.onChange}
                  renderOption={(option) => (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                      {option.label}
                    </div>
                  )}
                  renderSelection={(selected) => (
                    <div className="flex flex-wrap gap-1">
                      {selected.map((option) => {
                        const tag = tags.find((t) => t.id === option.value);
                        if (!tag) return null;

                        return (
                          <Badge
                            key={tag.id}
                            style={{
                              backgroundColor: tag.color,
                              color: isColorDark(tag.color) ? "white" : "black",
                            }}
                            className="flex items-center gap-1"
                          >
                            {tag.name}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                />
              </FormControl>
              <FormMessage />
              <p className="text-sm text-muted-foreground mt-1">
                O follow-up será aplicado apenas a clientes que possuem pelo
                menos uma das tags selecionadas.
              </p>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="exclusiveTags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags Exclusivas</FormLabel>
              <FormControl>
                <MultiSelect
                  options={tags.map((tag) => ({
                    value: tag.id,
                    label: tag.name,
                    color: tag.color,
                  }))}
                  placeholder="Selecione as tags exclusivas"
                  selected={field.value}
                  onChange={field.onChange}
                  renderOption={(option) => (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                      {option.label}
                    </div>
                  )}
                  renderSelection={(selected) => (
                    <div className="flex flex-wrap gap-1">
                      {selected.map((option) => {
                        const tag = tags.find((t) => t.id === option.value);
                        if (!tag) return null;

                        return (
                          <Badge
                            key={tag.id}
                            style={{
                              backgroundColor: tag.color,
                              color: isColorDark(tag.color) ? "white" : "black",
                            }}
                            className="flex items-center gap-1"
                          >
                            {tag.name}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                />
              </FormControl>
              <FormMessage />
              <p className="text-sm text-muted-foreground mt-1">
                O follow-up NÃO será aplicado a clientes que possuem QUALQUER
                uma destas tags.
              </p>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : initialData ? "Atualizar" : "Criar"}
        </Button>
      </form>
    </Form>
  );
}
