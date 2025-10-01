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
import { X } from "lucide-react";
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
import { TimeUnitPicker } from "@/components/ui/time-unit-picker";
import { minutesToTimeValue, timeValueToMinutes } from "@/lib/time-utils";
import { InactiveChatRangePicker } from "./InactiveChatRangePicker";

const formSchema = z
  .object({
    name: z.string().min(3, {
      message: "Nome deve ter pelo menos 3 caracteres",
    }),
    messages: z
      .array(
        z.string().min(10, {
          message: "Cada mensagem deve ter pelo menos 10 caracteres",
        })
      )
      .min(1, {
        message: "Configure pelo menos uma mensagem",
      }),
    minInactiveChatTime: z
      .number()
      .int()
      .positive("Tempo mínimo deve ser um número inteiro positivo"),
    maxInactiveChatTime: z
      .number()
      .int()
      .positive("Tempo máximo deve ser um número inteiro positivo"),
    maxMessages: z.coerce
      .number()
      .min(1, {
        message: "Número de mensagens deve ser pelo menos 1",
      })
      .optional(),
    assistantId: z.string().uuid({
      message: "Agente inválido",
    }),
    inclusiveTags: z.array(z.string().uuid("Tag ID must be a valid UUID")),
    exclusiveTags: z.array(z.string().uuid("Tag ID must be a valid UUID")),
    responseTags: z.array(z.string().uuid("Tag ID must be a valid UUID")),
  })
  .refine((data) => data.minInactiveChatTime <= data.maxInactiveChatTime, {
    message: "O tempo mínimo não pode ser maior que o tempo máximo",
    path: ["minInactiveChatTime"],
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
  let responseTagIds: string[] = [];

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

  if (initialData?.responseTags) {
    // Verifica se responseTags é um array de objetos ou um array de strings
    responseTagIds = Array.isArray(initialData.responseTags)
      ? initialData.responseTags.map(getTagId)
      : [];
  }

  const defaultValues = initialData
    ? {
        name: initialData.name,
        messages: initialData.messages || [],
        minInactiveChatTime: initialData.minInactiveChatTime || 60,
        maxInactiveChatTime: initialData.maxInactiveChatTime || 120,
        maxMessages: initialData.maxMessages || 3, // Default: 3 mensagens
        assistantId: initialData.assistantId,
        inclusiveTags: inclusiveTagIds,
        exclusiveTags: exclusiveTagIds,
        responseTags: responseTagIds,
      }
    : {
        name: "",
        messages: [""],
        minInactiveChatTime: 60, // Default: 1 hora
        maxInactiveChatTime: 120, // Default: 2 horas
        maxMessages: 3, // Default: 3 mensagens
        assistantId: "",
        inclusiveTags: [],
        exclusiveTags: [],
        responseTags: [],
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
          name="messages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensagens</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  {field.value.map((message: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Textarea
                        placeholder={`Mensagem ${index + 1}`}
                        className="min-h-[100px] flex-grow"
                        value={message}
                        onChange={(e) => {
                          const newMessages = [...field.value];
                          newMessages[index] = e.target.value;
                          field.onChange(newMessages);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (field.value.length > 1) {
                            const newMessages = [...field.value];
                            newMessages.splice(index, 1);
                            field.onChange(newMessages);
                          }
                        }}
                        disabled={field.value.length <= 1}
                        className="h-10 w-10 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </FormControl>
              <Button
                type="button"
                variant="outline"
                onClick={() => field.onChange([...field.value, ""])}
                className="w-full mt-2"
              >
                + Adicionar mensagem
              </Button>
              {form.formState.errors.messages && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.messages.root?.message ||
                    "Cada mensagem deve ter pelo menos 10 caracteres"}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                As mensagens serão escolhidas aleatoriamente para serem
                enviadas.
              </p>
            </FormItem>
          )}
        />

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">
              Intervalo de tempo de inatividade
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Defina o intervalo de tempo de inatividade do cliente antes de
              enviar o follow-up.
            </p>
          </div>

          <div className="grid gap-6">
            <FormField
              control={form.control}
              name="minInactiveChatTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempo mínimo de inatividade</FormLabel>
                  <FormControl>
                    <TimeUnitPicker
                      value={minutesToTimeValue(field.value)}
                      onChange={(timeValue) => {
                        const minutes = timeValueToMinutes(timeValue);
                        field.onChange(minutes);
                      }}
                      maxDays={7}
                      minTotalMinutes={60}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxInactiveChatTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempo máximo de inatividade</FormLabel>
                  <FormControl>
                    <TimeUnitPicker
                      value={minutesToTimeValue(field.value)}
                      onChange={(timeValue) => {
                        const minutes = timeValueToMinutes(timeValue);
                        field.onChange(minutes);
                      }}
                      maxDays={7}
                      minTotalMinutes={60}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="maxMessages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número máximo de mensagens</FormLabel>
              <FormControl>
                <Input type="number" min="1" placeholder="3" {...field} />
              </FormControl>
              <FormMessage />
              <p className="text-sm text-muted-foreground mt-1">
                Número máximo de follow-ups que serão enviados caso o cliente
                não responda.
              </p>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assistantId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agente</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um agente" />
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

        <FormField
          control={form.control}
          name="responseTags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags de Resposta</FormLabel>
              <FormControl>
                <MultiSelect
                  options={tags.map((tag) => ({
                    value: tag.id,
                    label: tag.name,
                    color: tag.color,
                  }))}
                  placeholder="Selecione as tags de resposta"
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
                Essas tags serão automaticamente atribuídas ao chat quando o
                follow-up for respondido pelo cliente.
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
