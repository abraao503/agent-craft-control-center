import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Megaphone,
  Loader2,
  Eye,
  Search,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageTemplateEditor } from "@/components/message-template";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TagSelector } from "@/components/pipelines/TagSelector";
import { listPipelines } from "@/services/pipeline/listPipelines";
import { listPipelineStages } from "@/services/pipeline/listPipelineStages";
import { listCustomers } from "@/services/customer/listCustomers";
import { Customer } from "@/types/customer";
import {
  createMassBroadcast,
  previewRecipients,
} from "@/services/mass-broadcast";
import { CreateMassBroadcastInput } from "@/types/mass-broadcast";
import { PipelineStageMinimal } from "@/types/pipeline";
import { formatPhone, getCustomerLabel } from "@/utils/phone";
import {
  getMetaCloudDiagnostic,
  listMetaCloudTemplates,
  MetaCloudTemplate,
  MetaCloudTemplateBinding,
} from "@/services/whatsapp/metaCloud";
import { useTranslation } from "react-i18next";

export default function MassBroadcastCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const { t } = useTranslation();
  const workspaceId = currentWorkspace?.id || "";

  // Form state
  const [name, setName] = useState("");
  const [messages, setMessages] = useState<string[]>([""]);
  const [selectedPipelineId, setSelectedPipelineId] = useState("");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [includeTagIds, setIncludeTagIds] = useState<string[]>([]);
  const [excludeTagIds, setExcludeTagIds] = useState<string[]>([]);
  const [applyTagIds, setApplyTagIds] = useState<string[]>([]);
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [messageDelaySeconds, setMessageDelaySeconds] = useState(30);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [metaTemplateId, setMetaTemplateId] = useState<string>("");
  const [metaTemplateBindings, setMetaTemplateBindings] = useState<Record<string, MetaCloudTemplateBinding>>({});

  // Customer search state
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPage, setCustomerPage] = useState(1);
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);

  // Pipeline stages for selection (all pipelines)
  const [allStages, setAllStages] = useState<
    (PipelineStageMinimal & { pipelineName: string })[]
  >([]);

  // Fetch pipelines
  const { data: pipelines, isLoading: isLoadingPipelines } = useQuery({
    queryKey: ["pipelines", workspaceId],
    queryFn: () => listPipelines(workspaceId),
    enabled: !!workspaceId,
  });
  const { data: metaDiagnostic } = useQuery({
    queryKey: ["meta-cloud-diagnostic", workspaceId],
    queryFn: getMetaCloudDiagnostic,
    enabled: Boolean(workspaceId),
  });
  const selectedMetaIntegration = metaDiagnostic?.integrations.find(
    (integration) => integration.pipelineId === selectedPipelineId,
  );
  const isMetaCampaign = Boolean(selectedMetaIntegration);
  const { data: metaTemplates } = useQuery({
    queryKey: [
      "meta-cloud-templates",
      workspaceId,
      selectedMetaIntegration?.id,
    ],
    queryFn: () =>
      listMetaCloudTemplates("APPROVED", selectedMetaIntegration?.id),
    enabled: Boolean(
      workspaceId && metaDiagnostic?.enabled && selectedMetaIntegration,
    ),
  });
  const selectedMetaTemplate = metaTemplates?.find((template) => template.id === metaTemplateId);

  const getMetaTemplateSlots = (template?: MetaCloudTemplate): string[] => {
    if (!template || !Array.isArray(template.components)) return [];
    const slots: string[] = [];
    const variables = (value: unknown) =>
      typeof value === "string" ? value.match(/\{\{\s*\d+\s*\}\}/g) ?? [] : [];
    (template.components as Array<Record<string, unknown>>).forEach((component) => {
      const type = String(component.type ?? "").toUpperCase();
      if (type === "HEADER" && String(component.format ?? "").toUpperCase() === "TEXT") {
        variables(component.text).forEach((_item, index) => slots.push(`header.${index + 1}`));
      }
      if (type === "BODY") {
        variables(component.text).forEach((_item, index) => slots.push(`body.${index + 1}`));
      }
      if (type === "BUTTONS" && Array.isArray(component.buttons)) {
        (component.buttons as Array<Record<string, unknown>>).forEach((button, buttonIndex) => {
          if (String(button.type ?? "").toUpperCase() !== "URL") return;
          variables(button.url).forEach((_item, index) => slots.push(`button.${buttonIndex}.${index + 1}`));
        });
      }
    });
    return slots;
  };

  useEffect(() => {
    if (!isMetaCampaign || !metaTemplates?.length) return;
    const nextTemplate = metaTemplates.find((template) => template.id === metaTemplateId) ?? metaTemplates[0];
    if (nextTemplate.id !== metaTemplateId) setMetaTemplateId(nextTemplate.id);
    setMetaTemplateBindings((current) => {
      const next: Record<string, MetaCloudTemplateBinding> = {};
      getMetaTemplateSlots(nextTemplate).forEach((slot) => {
        next[slot] = current[slot] ?? { source: "fixed", value: "" };
      });
      return next;
    });
  }, [isMetaCampaign, metaTemplates, metaTemplateId]);

  useEffect(() => {
    // A file selected for a legacy provider must never leak into a Meta
    // campaign payload, whose only outbound content is the approved template.
    if (isMetaCampaign && file) setFile(null);
  }, [file, isMetaCampaign]);

  // Fetch customers for direct selection
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(customerSearch);
      setCustomerPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: [
      "customers-broadcast",
      workspaceId,
      customerPage,
      debouncedSearch,
    ],
    queryFn: () =>
      listCustomers(
        {
          page: customerPage,
          limit: 50,
          search: debouncedSearch || undefined,
        },
        workspaceId,
      ),
    enabled: !!workspaceId,
  });

  // Toggle customer selection
  const toggleCustomer = (customer: Customer) => {
    const isSelected = selectedCustomerIds.includes(customer.id);
    if (isSelected) {
      setSelectedCustomerIds((prev) => prev.filter((id) => id !== customer.id));
      setSelectedCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    } else {
      setSelectedCustomerIds((prev) => [...prev, customer.id]);
      setSelectedCustomers((prev) => [...prev, customer]);
    }
  };

  const removeCustomer = (customerId: string) => {
    setSelectedCustomerIds((prev) => prev.filter((id) => id !== customerId));
    setSelectedCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

  const clearAllCustomers = () => {
    setSelectedCustomerIds([]);
    setSelectedCustomers([]);
  };

  // Fetch stages for all pipelines (for filter selection)
  useEffect(() => {
    if (!pipelines || !workspaceId) return;

    const fetchAllStages = async () => {
      const stagesPromises = pipelines.map(async (pipeline) => {
        try {
          const stages = await listPipelineStages(pipeline.id, workspaceId);
          return stages.map((stage) => ({
            ...stage,
            pipelineName: pipeline.name,
          }));
        } catch {
          return [];
        }
      });

      const results = await Promise.all(stagesPromises);
      setAllStages(results.flat());
    };

    fetchAllStages();
  }, [pipelines, workspaceId]);

  // Preview recipients
  const previewMutation = useMutation({
    mutationFn: () =>
      previewRecipients({
        workspaceId,
        customerIds:
          selectedCustomerIds.length > 0 ? selectedCustomerIds : undefined,
        includeTagIds: includeTagIds.length > 0 ? includeTagIds : undefined,
        excludeTagIds: excludeTagIds.length > 0 ? excludeTagIds : undefined,
        pipelineStageIds:
          selectedStageIds.length > 0 ? selectedStageIds : undefined,
        pipelineId: selectedPipelineId || undefined,
        integrationId: selectedMetaIntegration?.id,
        templateId: isMetaCampaign ? metaTemplateId : undefined,
        bindings: isMetaCampaign ? metaTemplateBindings : undefined,
      }),
    onSuccess: (data) => {
      toast({
        title: t("broadcasts.previewSuccess"),
        description: data.total === 1
          ? t("broadcasts.previewOne")
          : t("broadcasts.previewMany", { count: data.total }),
      });
    },
    onError: () => {
      toast({
        title: t("broadcasts.previewErrorTitle"),
        description: t("broadcasts.previewError"),
        variant: "destructive",
      });
    },
  });

  // Create campaign
  const createMutation = useMutation({
    mutationFn: (data: CreateMassBroadcastInput) => createMassBroadcast(data),
    onSuccess: (broadcast) => {
      toast({
        title: t("broadcasts.created"),
        description: t("broadcasts.createdDescription", {
          name: broadcast.name,
          count: broadcast.totalRecipients,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: ["mass-broadcasts", workspaceId],
      });
      navigate(`/broadcasts/${broadcast.id}`);
    },
    onError: (
      error: Error & { response?: { data?: { message?: string } } },
    ) => {
      const apiMessage = error?.response?.data?.message || error?.message || "";

      const errorMessages: Record<string, string> = {
        "Pipeline not found": t("broadcastCreate.pipelineNotFound"),
        "Pipeline has no WhatsApp integration": t("broadcastCreate.pipelineNoIntegration"),
        "No recipients found for the given criteria": t("broadcastCreate.noRecipients"),
        "Invalid tags": t("broadcastCreate.invalidTags"),
        "Invalid pipeline stages": t("broadcastCreate.invalidStages"),
        "Messages cannot be empty": t("broadcastCreate.emptyMessages"),
        "Internal error": t("broadcastCreate.internalError"),
      };

      const description =
        errorMessages[apiMessage] ||
        apiMessage ||
        t("broadcastCreate.createError");

      toast({
        title: t("broadcasts.createError"),
        description,
        variant: "destructive",
      });
    },
  });

  // Message helpers
  const addMessage = () => {
    if (messages.length < 20) {
      setMessages([...messages, ""]);
    }
  };

  const removeMessage = (index: number) => {
    if (messages.length > 1) {
      setMessages(messages.filter((_, i) => i !== index));
    }
  };

  const updateMessage = (index: number, value: string) => {
    const updated = [...messages];
    updated[index] = value;
    setMessages(updated);
  };

  // Stage toggle
  const toggleStage = (stageId: string) => {
    setSelectedStageIds((prev) =>
      prev.includes(stageId)
        ? prev.filter((id) => id !== stageId)
        : [...prev, stageId],
    );
  };

  // Validation
  const hasSelectionCriteria =
    selectedCustomerIds.length > 0 ||
    includeTagIds.length > 0 ||
    selectedStageIds.length > 0;

  const hasValidMessages = isMetaCampaign || messages.some((m) => m.trim().length > 0);
  const hasValidMetaTemplate = !isMetaCampaign || Boolean(metaTemplateId);

  const canSubmit =
    name.trim() &&
    selectedPipelineId &&
    hasValidMessages &&
    hasSelectionCriteria &&
    hasValidMetaTemplate;

  const canPreview = hasSelectionCriteria;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      toast({
        title: t("broadcasts.requiredFields"),
        description: t("broadcasts.requiredDescription"),
        variant: "destructive",
      });
      return;
    }

    const filteredMessages = messages.filter((m) => m.trim().length > 0);

    const input: CreateMassBroadcastInput = {
      name: name.trim(),
      messages: isMetaCampaign ? [] : filteredMessages,
      pipelineId: selectedPipelineId,
      workspaceId,
      customerIds:
        selectedCustomerIds.length > 0 ? selectedCustomerIds : undefined,
      includeTagIds: includeTagIds.length > 0 ? includeTagIds : undefined,
      excludeTagIds: excludeTagIds.length > 0 ? excludeTagIds : undefined,
      pipelineStageIds:
        selectedStageIds.length > 0 ? selectedStageIds : undefined,
      applyTagIds: applyTagIds.length > 0 ? applyTagIds : undefined,
      messageDelaySeconds,
      startTime: startTime ? new Date(startTime).toISOString() : undefined,
      endTime: endTime ? new Date(endTime).toISOString() : undefined,
      file: file || undefined,
      provider: isMetaCampaign ? "meta-cloud" : undefined,
      metaTemplateId: isMetaCampaign ? metaTemplateId : undefined,
      metaTemplateLanguage: isMetaCampaign ? selectedMetaTemplate?.language : undefined,
      metaTemplateBindings: isMetaCampaign ? metaTemplateBindings : undefined,
    };

    createMutation.mutate(input);
  };

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          {t("broadcastCreate.selectWorkspace")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/broadcasts")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t("broadcastCreate.title")}</h1>
          <p className="text-muted-foreground">
            {t("broadcastCreate.description")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t("broadcastCreate.basicInfo")}</CardTitle>
            <CardDescription>
              {t("broadcastCreate.basicDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("broadcastCreate.campaignName")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("broadcastCreate.campaignNamePlaceholder")}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pipeline">{t("broadcastCreate.pipeline")}</Label>
              <Select
                value={selectedPipelineId}
                onValueChange={setSelectedPipelineId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("broadcastCreate.pipelinePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingPipelines ? (
                    <SelectItem value="loading" disabled>
                      {t("broadcastCreate.loading")}
                    </SelectItem>
                  ) : (
                    pipelines?.map((pipeline) => (
                      <SelectItem key={pipeline.id} value={pipeline.id}>
                        {pipeline.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("broadcastCreate.pipelineHelp")}
              </p>
            </div>
          </CardContent>
        </Card>

        {!isMetaCampaign && <>
        {/* Mídia */}
        <Card>
          <CardHeader>
            <CardTitle>{t("broadcastCreate.media")}</CardTitle>
            <CardDescription>
              {t("broadcastCreate.mediaDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileInput">{t("broadcastCreate.file")}</Label>
              <Input
                id="fileInput"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                {t("broadcastCreate.mediaLimit")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle>{t("broadcastCreate.messages")}</CardTitle>
            <CardDescription>
              {t("broadcastCreate.messagesDescription")} {t("broadcastCreate.messageVariables")} {" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                {t("broadcastCreate.variableFirstName")}
              </code>
              ,{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                {t("broadcastCreate.variableFullName")}
              </code>{" "}
              {t("broadcastCreate.messageVariablesAnd")} {" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                {t("broadcastCreate.variableEmail")}
              </code>{" "}
              {t("broadcastCreate.messageVariablesSuffix")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t("broadcastCreate.variation", { count: index + 1 })}</Label>
                  {messages.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeMessage(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t("broadcastCreate.remove")}
                    </Button>
                  )}
                </div>
                <MessageTemplateEditor
                  value={message}
                  onChange={(val) => updateMessage(index, val)}
                  placeholder={t("broadcastCreate.messagePlaceholder")}
                />
              </div>
            ))}
            {messages.length < 20 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMessage}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t("broadcastCreate.addVariation")}
              </Button>
            )}
          </CardContent>
        </Card>
        </>}

        {isMetaCampaign && (
          <Card>
            <CardHeader>
              <CardTitle>{t("broadcastCreate.metaTemplate")}</CardTitle>
              <CardDescription>
                {t("broadcastCreate.metaTemplateDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={metaTemplateId} onValueChange={setMetaTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("broadcastCreate.metaTemplatePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {(metaTemplates ?? []).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} · {template.language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMetaTemplate && getMetaTemplateSlots(selectedMetaTemplate).map((slot) => (
                <div key={slot} className="space-y-1">
                  <Label htmlFor={`broadcast-${slot}`}>{slot}</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Select
                      value={metaTemplateBindings[slot]?.source ?? "fixed"}
                      onValueChange={(source) => setMetaTemplateBindings((current) => ({
                        ...current,
                        [slot]:
                          source === "fixed"
                            ? { source: "fixed", value: "" }
                            : source === "customer"
                              ? { source: "customer", field: "name" }
                              : source === "deal"
                                ? { source: "deal", field: "id" }
                                : { source: "owner", field: "name" },
                      }))}
                    >
                      <SelectTrigger><SelectValue placeholder={t("broadcastCreate.source")} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">{t("broadcastCreate.fixedValue")}</SelectItem>
                        <SelectItem value="customer">{t("broadcastCreate.customer")}</SelectItem>
                        <SelectItem value="deal">{t("broadcastCreate.contextualDeal")}</SelectItem>
                        <SelectItem value="owner">{t("broadcastCreate.owner")}</SelectItem>
                      </SelectContent>
                    </Select>
                    {metaTemplateBindings[slot]?.source === "fixed" || !metaTemplateBindings[slot] ? (
                      <Input
                        id={`broadcast-${slot}`}
                        value={metaTemplateBindings[slot]?.source === "fixed" ? metaTemplateBindings[slot].value : ""}
                        onChange={(event) => setMetaTemplateBindings((current) => ({
                          ...current,
                          [slot]: { source: "fixed", value: event.target.value },
                        }))}
                        placeholder={t("broadcastCreate.parameterValue")}
                      />
                    ) : (
                      <Select
                        value={`${metaTemplateBindings[slot].source}:${metaTemplateBindings[slot].field}`}
                        onValueChange={(value) => setMetaTemplateBindings((current) => {
                          const [source, field] = value.split(":");
                          return {
                            ...current,
                            [slot]: source === "customer"
                              ? { source: "customer", field: field as "name" | "firstName" | "phone" | "email" }
                              : source === "deal"
                                ? { source: "deal", field: field as "id" | "pipeline" | "stage" }
                                : { source: "owner", field: "name" },
                          };
                        })}
                      >
                        <SelectTrigger><SelectValue placeholder={t("broadcastCreate.field")} /></SelectTrigger>
                        <SelectContent>
                          {metaTemplateBindings[slot].source === "customer" && <>
                            <SelectItem value="customer:name">{t("broadcastCreate.fullName")}</SelectItem>
                            <SelectItem value="customer:firstName">{t("broadcastCreate.firstName")}</SelectItem>
                            <SelectItem value="customer:phone">{t("broadcastCreate.phone")}</SelectItem>
                            <SelectItem value="customer:email">{t("broadcastCreate.email")}</SelectItem>
                          </>}
                          {metaTemplateBindings[slot].source === "deal" && <>
                            <SelectItem value="deal:id">{t("broadcastCreate.identifier")}</SelectItem>
                            <SelectItem value="deal:pipeline">{t("broadcastCreate.pipelineField")}</SelectItem>
                            <SelectItem value="deal:stage">{t("broadcastCreate.stage")}</SelectItem>
                          </>}
                          {metaTemplateBindings[slot].source === "owner" && <SelectItem value="owner:name">{t("broadcastCreate.owner")}</SelectItem>}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Selection Criteria */}
        <Card>
          <CardHeader>
            <CardTitle>{t("broadcastCreate.criteria")}</CardTitle>
            <CardDescription>
              {t("broadcastCreate.criteriaDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <TagSelector
                workspaceId={workspaceId}
                selectedTagIds={includeTagIds}
                onSelectionChange={setIncludeTagIds}
                label={t("broadcastCreate.includeTags")}
                placeholder={t("broadcastCreate.includePlaceholder")}
                emptyMessage={t("broadcastCreate.includeEmpty")}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("broadcastCreate.includeHelp")}
              </p>
            </div>

            <Separator />

            <div>
              <TagSelector
                workspaceId={workspaceId}
                selectedTagIds={excludeTagIds}
                onSelectionChange={setExcludeTagIds}
                label={t("broadcastCreate.excludeTags")}
                placeholder={t("broadcastCreate.excludePlaceholder")}
                emptyMessage={t("broadcastCreate.excludeEmpty")}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("broadcastCreate.excludeHelp")}
              </p>
            </div>

            <Separator />

            {/* Pipeline Stages */}
            <div className="space-y-2">
              <Label>{t("broadcastCreate.stages")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("broadcastCreate.stagesHelp")}
              </p>
              {allStages.length > 0 ? (
                <div className="grid gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                  {/* Group stages by pipeline */}
                  {pipelines?.map((pipeline) => {
                    const pipelineStages = allStages.filter(
                      (s) => s.pipelineName === pipeline.name,
                    );
                    if (pipelineStages.length === 0) return null;

                    return (
                      <div key={pipeline.id} className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {pipeline.name}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {pipelineStages.map((stage) => (
                            <Badge
                              key={stage.id}
                              variant={
                                selectedStageIds.includes(stage.id)
                                  ? "default"
                                  : "outline"
                              }
                              className="cursor-pointer transition-colors"
                              style={
                                selectedStageIds.includes(stage.id) &&
                                stage.color
                                  ? {
                                      backgroundColor: stage.color,
                                      color: "#fff",
                                      borderColor: stage.color,
                                    }
                                  : undefined
                              }
                              onClick={() => toggleStage(stage.id)}
                            >
                              {stage.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("broadcastCreate.noStages")}
                </p>
              )}
              {selectedStageIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("broadcastCreate.selectedStages", { count: selectedStageIds.length })}
                </p>
              )}
            </div>

            <Separator />

            {/* Direct Customer Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t("broadcastCreate.directSelection")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("broadcastCreate.directHelp")}
                  </p>
                </div>
                {selectedCustomerIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {t("broadcastCreate.selectedCount", { count: selectedCustomerIds.length })}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearAllCustomers}
                      className="h-7 text-xs text-muted-foreground"
                    >
                      {t("broadcastCreate.clearAll")}
                    </Button>
                  </div>
                )}
              </div>

              {/* Selected customers chips */}
              {selectedCustomers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedCustomers.map((customer) => (
                    <Badge
                      key={customer.id}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {getCustomerLabel(customer)}
                      <button
                        type="button"
                        onClick={() => removeCustomer(customer.id)}
                        className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("broadcastCreate.customerSearch")}
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Customer list */}
              <div className="border rounded-md max-h-60 overflow-y-auto">
                {isLoadingCustomers ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : !customersData?.items.length ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {customerSearch
                      ? t("broadcastCreate.noSearchResults")
                      : t("broadcastCreate.noCustomers")}
                  </div>
                ) : (
                  <div className="divide-y">
                    {customersData.items.map((customer) => {
                      const isSelected = selectedCustomerIds.includes(
                        customer.id,
                      );
                      return (
                        <label
                          key={customer.id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleCustomer(customer)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {customer.name || t("broadcastCreate.unnamed")}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {customer.phone
                                ? formatPhone(customer.phone)
                                : t("broadcastCreate.noPhone")}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {customersData && customersData.totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {t("broadcastCreate.pageOf", {
                      page: customerPage,
                      totalPages: customersData.totalPages,
                      total: customersData.total,
                    })}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={customerPage <= 1}
                      onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
                    >
                      {t("broadcastCreate.previous")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={
                        customerPage >= (customersData?.totalPages ?? 1)
                      }
                      onClick={() => setCustomerPage((p) => p + 1)}
                    >
                      {t("broadcastCreate.next")}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Preview */}
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => previewMutation.mutate()}
                disabled={!canPreview || previewMutation.isPending}
              >
                {previewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {t("broadcastCreate.preview")}
              </Button>
              {previewMutation.data && (
                <span className="text-sm font-medium">
                  {t("broadcastCreate.previewCount", { count: previewMutation.data.total })}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Post-send tags */}
        <Card>
          <CardHeader>
            <CardTitle>{t("broadcastCreate.postTags")}</CardTitle>
            <CardDescription>
              {t("broadcastCreate.postDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TagSelector
              workspaceId={workspaceId}
              selectedTagIds={applyTagIds}
              onSelectionChange={setApplyTagIds}
              label=""
              placeholder={t("broadcastCreate.postPlaceholder")}
              emptyMessage={t("broadcastCreate.noTags")}
            />
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>{t("broadcastCreate.sendConfig")}</CardTitle>
            <CardDescription>
              {t("broadcastCreate.sendDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delay">
                {t("broadcastCreate.delay")}
              </Label>
              <Input
                id="delay"
                type="number"
                min={10}
                max={300}
                value={messageDelaySeconds}
                onChange={(e) => setMessageDelaySeconds(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                {t("broadcastCreate.delayHelp")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">{t("broadcastCreate.windowStart")}</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t("broadcastCreate.optionalAfter")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">{t("broadcastCreate.windowEnd")}</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t("broadcastCreate.optionalBefore")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/broadcasts")}
          >
            {t("broadcastCreate.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit || createMutation.isPending}
          >
            {createMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            {t("broadcastCreate.create")}
          </Button>
        </div>
      </form>
    </div>
  );
}
