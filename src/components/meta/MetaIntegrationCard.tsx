import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  CircleAlert,
  Facebook,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/auth/hooks";
import { useTranslation } from "react-i18next";
import { getAgent } from "@/services/agent/getAgent";
import { listPipelineStages } from "@/services/pipeline/listPipelineStages";
import { listPipelines } from "@/services/pipeline/listPipelines";
import type {
  MetaLeadEventStatus,
  MetaLeadFormMapping,
} from "@/types/meta-integration";
import {
  deleteMetaLeadFormMapping,
  getMetaIntegration,
  disconnectMetaIntegration,
  listMetaLeadEvents,
  listMetaLeadForms,
  resolveMetaLeadPhone,
  retryMetaLeadEvent,
  saveMetaLeadFormMapping,
  selectMetaAssets,
  startMetaOAuth,
  syncMetaIntegration,
} from "@/services/meta-integration";

interface Props {
  workspaceId?: string;
  showHeader?: boolean;
}

const statusLabel: Record<string, string> = {
  CONNECTED: "Conectado",
  NEEDS_REAUTHORIZATION: "Reautorização necessária",
  DISCONNECTED: "Desconectado",
  ERROR: "Erro de conexão",
  CONNECTING: "Conectando",
};

const eventStatusOptions: Array<{
  value: MetaLeadEventStatus | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "Todas as pendências" },
  { value: "RECEIVED", label: "Recebidos" },
  { value: "PROCESSING", label: "Processando" },
  { value: "WAITING_MAPPING", label: "Aguardando mapping" },
  { value: "WAITING_PHONE", label: "Aguardando telefone" },
  { value: "WAITING_REAUTHORIZATION", label: "Aguardando reautorização" },
  { value: "FAILED_PERMANENT", label: "Falha permanente" },
];

const eventStatusLabel: Record<string, string> = Object.fromEntries(
  eventStatusOptions
    .filter((option) => option.value !== "ALL")
    .map((option) => [option.value, option.label]),
);

const subscriptionStatusLabel: Record<string, string> = {
  SUBSCRIBED: "Leitura ativa",
  UNSUBSCRIBED: "Não inscrita",
  ERROR: "Problema na inscrição",
};

type MetaQuestion = {
  key: string;
  label: string;
};

function getMetaQuestions(questions: unknown): MetaQuestion[] {
  if (!Array.isArray(questions)) return [];

  return questions.flatMap((question) => {
    if (!question || typeof question !== "object") return [];
    const record = question as Record<string, unknown>;
    const key = [record.key, record.name, record.id, record.question].find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    );
    if (!key) return [];
    const label = [record.label, record.name, record.question, key].find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    );
    return [{ key, label: label ?? key }];
  });
}

function addCurrentQuestion(
  questions: MetaQuestion[],
  currentValue: string | undefined,
): MetaQuestion[] {
  if (!currentValue || questions.some((question) => question.key === currentValue))
    return questions;
  return [{ key: currentValue, label: currentValue }, ...questions];
}

export function MetaIntegrationCard({
  workspaceId,
  showHeader = true,
}: Props) {
  const { userProfile } = useAuth();
  const { t } = useTranslation();
  const { has, isCompanyLevel } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [phoneOverrides, setPhoneOverrides] = useState<Record<string, string>>(
    {},
  );
  const [mappingForm, setMappingForm] = useState<string | null>(null);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsStatus, setEventsStatus] = useState<
    MetaLeadEventStatus | "ALL"
  >("ALL");
  const [mappingValues, setMappingValues] = useState({
    phone: "",
    name: "",
    email: "",
    pipelineId: "",
    stageId: "",
    custom: [] as MetaLeadFormMapping["fields"]["custom"],
  });
  const popupRef = useRef<Window | null>(null);

  const integrationQuery = useQuery({
    queryKey: ["meta-integration", userProfile?.companyId],
    queryFn: getMetaIntegration,
    enabled: Boolean(userProfile?.companyId),
  });
  const data = integrationQuery.data;
  const integration = data?.integration;
  const canManageIntegration = has("manage:integrations");
  const canManageConnection = canManageIntegration && has("manage:company");
  const companyWideView = isCompanyLevel();
  const formsWorkspaceId = companyWideView ? undefined : workspaceId;
  const eventsWorkspaceId = companyWideView ? undefined : workspaceId;

  const formsQuery = useQuery({
    queryKey: [
      "meta-lead-forms",
      userProfile?.companyId,
      workspaceId,
      companyWideView,
    ],
    queryFn: () => listMetaLeadForms(formsWorkspaceId),
    enabled: Boolean(
      userProfile?.companyId && integrationQuery.data?.integration,
    ),
  });
  const eventsQuery = useQuery({
    queryKey: [
      "meta-lead-events",
      userProfile?.companyId,
      workspaceId,
      companyWideView,
      eventsPage,
      eventsStatus,
    ],
    queryFn: () =>
      listMetaLeadEvents({
        workspaceId: eventsWorkspaceId,
        page: eventsPage,
        limit: 25,
        ...(eventsStatus !== "ALL" ? { status: eventsStatus } : {}),
      }),
    enabled: Boolean(
      userProfile?.companyId && integrationQuery.data?.integration,
    ),
    placeholderData: (previousData) => previousData,
  });

  const pipelinesQuery = useQuery({
    queryKey: ["meta-mapping-pipelines", workspaceId],
    queryFn: () => listPipelines(workspaceId!),
    enabled: Boolean(workspaceId && canManageIntegration && mappingForm),
  });
  const selectedPipeline = pipelinesQuery.data?.find(
    (pipeline) => pipeline.id === mappingValues.pipelineId,
  );
  const stagesQuery = useQuery({
    queryKey: [
      "meta-mapping-stages",
      workspaceId,
      mappingValues.pipelineId,
    ],
    queryFn: () => listPipelineStages(mappingValues.pipelineId, workspaceId!),
    enabled: Boolean(
      workspaceId &&
        canManageIntegration &&
        mappingForm &&
        mappingValues.pipelineId,
    ),
  });
  const assistantQuery = useQuery({
    queryKey: [
      "meta-mapping-assistant",
      workspaceId,
      selectedPipeline?.assistantId,
    ],
    queryFn: () => getAgent(selectedPipeline!.assistantId!, workspaceId!),
    enabled: Boolean(
      workspaceId &&
        canManageIntegration &&
        mappingForm &&
        selectedPipeline?.assistantId,
    ),
  });

  const selectedSummary = useMemo(
    () =>
      t("integrations.metaSelectedSummary", {
        accounts: selectedAccounts.length,
        pages: selectedPages.length,
      }),
    [selectedAccounts.length, selectedPages.length, t],
  );

  useEffect(() => {
    if (!data) return;
    setSelectedAccounts(
      data.adAccounts
        .filter((item) => item.selected)
        .map((item) => item.accountId),
    );
    setSelectedPages(
      data.pages.filter((item) => item.selected).map((item) => item.pageId),
    );
  }, [data]);

  useEffect(() => {
    setEventsPage(1);
  }, [workspaceId, eventsStatus]);

  useEffect(() => {
    setMappingForm(null);
    setMappingValues({
      phone: "",
      name: "",
      email: "",
      pipelineId: "",
      stageId: "",
      custom: [],
    });
  }, [workspaceId]);

  const invalidate = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["meta-integration", userProfile?.companyId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["meta-lead-forms", userProfile?.companyId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["meta-lead-events", userProfile?.companyId],
      }),
    ]);
  }, [queryClient, userProfile?.companyId]);

  const connectMutation = useMutation({
    mutationFn: startMetaOAuth,
    onSuccess: ({ authorizationUrl }) => {
      const popup = window.open(
        authorizationUrl,
        "MetaOAuth",
        "width=620,height=760",
      );
      popupRef.current = popup;
      if (!popup) window.location.assign(authorizationUrl);
      else
        toast({
          title: "Autorização Meta aberta",
          description: "Conclua o acesso na janela da Meta.",
        });
    },
    onError: () =>
      toast({
        title: "Não foi possível iniciar a conexão",
        variant: "destructive",
      }),
  });
  const syncMutation = useMutation({
    mutationFn: syncMetaIntegration,
    onSuccess: async () => {
      await invalidate();
      toast({ title: "Ativos Meta sincronizados" });
    },
    onError: () =>
      toast({
        title: "Falha ao sincronizar ativos Meta",
        variant: "destructive",
      }),
  });
  const assetsMutation = useMutation({
    mutationFn: () =>
      selectMetaAssets({
        adAccountIds: selectedAccounts,
        pageIds: selectedPages,
      }),
    onSuccess: async () => {
      await invalidate();
      toast({ title: "Seleção de ativos salva" });
    },
    onError: () =>
      toast({ title: "Falha ao salvar ativos", variant: "destructive" }),
  });
  const disconnectMutation = useMutation({
    mutationFn: disconnectMetaIntegration,
    onSuccess: async () => {
      await invalidate();
      toast({ title: "Conexão Meta removida" });
    },
    onError: () =>
      toast({ title: "Falha ao remover conexão Meta", variant: "destructive" }),
  });
  const mappingMutation = useMutation({
    mutationFn: ({ formId, active }: { formId: string; active: boolean }) =>
      saveMetaLeadFormMapping(formId, {
        workspaceId: workspaceId ?? "",
        pipelineId: mappingValues.pipelineId.trim(),
        stageId: mappingValues.stageId.trim(),
        active,
        fields: {
          phone: mappingValues.phone.trim(),
          ...(mappingValues.name.trim()
            ? { name: mappingValues.name.trim() }
            : {}),
          ...(mappingValues.email.trim()
            ? { email: mappingValues.email.trim() }
            : {}),
          custom: mappingValues.custom.map((field) => ({
            metaField: field.metaField.trim(),
            customerCustomFieldId: field.customerCustomFieldId,
          })),
        },
      }),
    onSuccess: async () => {
      await invalidate();
      setMappingForm(null);
      toast({ title: "Mapping salvo" });
    },
    onError: () =>
      toast({
        title: "Não foi possível salvar o mapping",
        variant: "destructive",
      }),
  });
  const deleteMappingMutation = useMutation({
    mutationFn: deleteMetaLeadFormMapping,
    onSuccess: async () => {
      await invalidate();
      setMappingForm(null);
      toast({ title: "Mapping desativado" });
    },
    onError: () =>
      toast({
        title: "Não foi possível desativar o mapping",
        variant: "destructive",
      }),
  });
  const retryMutation = useMutation({
    mutationFn: retryMetaLeadEvent,
    onSuccess: async () => {
      await invalidate();
      toast({ title: "Evento reenfileirado" });
    },
    onError: () =>
      toast({
        title: "Não foi possível reenfileirar o evento",
        variant: "destructive",
      }),
  });
  const phoneMutation = useMutation({
    mutationFn: ({ id, phone }: { id: string; phone: string }) =>
      resolveMetaLeadPhone(id, phone),
    onSuccess: async () => {
      await invalidate();
      toast({ title: "Telefone enviado para processamento" });
    },
    onError: () =>
      toast({ title: "Telefone inválido", variant: "destructive" }),
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (popupRef.current?.closed) {
        popupRef.current = null;
        void invalidate();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [invalidate]);

  const mappingValidationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!workspaceId) errors.push("selecione um workspace");
    if (!mappingValues.phone.trim()) errors.push("informe o campo de telefone");
    if (!mappingValues.pipelineId) errors.push("selecione um pipeline");
    if (!mappingValues.stageId) errors.push("selecione uma etapa");
    if (
      mappingValues.custom.some(
        (field) => !field.metaField.trim() || !field.customerCustomFieldId,
      )
    )
      errors.push("complete ou remova os campos personalizados incompletos");
    return errors;
  }, [mappingValues, workspaceId]);

  const pendingEvents = useMemo(
    () =>
      (eventsQuery.data?.items ?? []).filter(
        (event) =>
          !["PROCESSED", "EXPIRED", "IGNORED_UNKNOWN_PAGE"].includes(
            event.status,
          ),
      ),
    [eventsQuery.data?.items],
  );

  return (
    <Card className="w-full">
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Facebook className="h-5 w-5 text-blue-600" /> Meta Ads e Lead Ads
          </CardTitle>
          <CardDescription>
            Conexão da empresa para leitura de anúncios, Páginas e formulários.
            Nenhuma campanha é alterada.
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={showHeader ? "space-y-6" : "space-y-6 pt-6"}>
        {integrationQuery.isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : integrationQuery.isError ? (
          <Alert variant="destructive">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              Não foi possível carregar a conexão Meta.
              <Button
                size="sm"
                variant="outline"
                onClick={() => void integrationQuery.refetch()}
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                {integration?.status === "CONNECTED" ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                ) : (
                  <CircleAlert className="h-6 w-6 text-amber-600" />
                )}
                <div>
                  <p className="font-medium">
                    {integration
                      ? statusLabel[integration.status]
                      : "Não conectado"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {integration?.lastDiagnosticMessage ??
                      "Use uma conta Meta com as permissões exigidas para ler anúncios, Páginas e formulários."}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 sm:flex-nowrap sm:justify-end">
                {canManageConnection && (
                  <Button
                    onClick={() => connectMutation.mutate()}
                    disabled={connectMutation.isPending}
                    isLoading={connectMutation.isPending}
                  >
                    {integration ? "Reconectar" : "Conectar Meta"}
                  </Button>
                )}
                {integration && canManageIntegration && (
                  <Button
                    variant="outline"
                    onClick={() => syncMutation.mutate()}
                    disabled={
                      syncMutation.isPending || integration.status !== "CONNECTED"
                    }
                    isLoading={syncMutation.isPending}
                  >
                    <RefreshCw /> Sincronizar
                  </Button>
                )}
                {integration && canManageConnection && (
                  <Button
                    variant="ghost"
                    onClick={() => disconnectMutation.mutate()}
                    disabled={disconnectMutation.isPending}
                    isLoading={disconnectMutation.isPending}
                  >
                    Desconectar
                  </Button>
                )}
              </div>
            </div>
            {integration && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <AssetList
                    title="Contas de anúncios"
                    items={data.adAccounts}
                    selected={selectedAccounts}
                    disabled={
                      !canManageConnection || integration.status !== "CONNECTED"
                    }
                    keyFor={(item) => item.accountId}
                    onToggle={(id) =>
                      setSelectedAccounts((current) =>
                        current.includes(id)
                          ? current.filter((value) => value !== id)
                          : [...current, id],
                      )
                    }
                  />
                  <AssetList
                    title="Páginas"
                    items={data.pages}
                    selected={selectedPages}
                    disabled={
                      !canManageConnection || integration.status !== "CONNECTED"
                    }
                    keyFor={(item) => item.pageId}
                    onToggle={(id) =>
                      setSelectedPages((current) =>
                        current.includes(id)
                          ? current.filter((value) => value !== id)
                          : [...current, id],
                      )
                    }
                  />
                </div>
                {canManageConnection && (
                  <Button
                    variant="outline"
                    onClick={() => assetsMutation.mutate()}
                    disabled={
                      assetsMutation.isPending ||
                      integration.status !== "CONNECTED"
                    }
                    isLoading={assetsMutation.isPending}
                  >
                    <Save />
                    {t("integrations.saveSelectedAssets", {
                      summary: selectedSummary,
                    })}
                  </Button>
                )}
                <details className="group rounded-lg border bg-muted/20">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                    <span>Detalhes técnicos da conexão</span>
                    <span className="text-xs font-normal text-muted-foreground group-open:hidden">
                      Permissões e validade do token
                    </span>
                    <span className="hidden text-xs font-normal text-muted-foreground group-open:inline">
                      Ocultar
                    </span>
                  </summary>
                  <div className="space-y-1 border-t px-4 py-3 text-xs text-muted-foreground">
                    <p>
                      Permissões concedidas:{" "}
                      {integration?.grantedScopes?.length
                        ? integration.grantedScopes.join(", ")
                        : "nenhuma"}
                    </p>
                    <p>Permissões exigidas: {data.requiredScopes.join(", ")}</p>
                    {integration?.tokenExpiresAt && (
                      <p>
                        Token válido até:{" "}
                        {new Date(integration.tokenExpiresAt).toLocaleString()}
                      </p>
                    )}
                    {integration?.lastValidatedAt && (
                      <p>
                        Última validação: {new Date(integration.lastValidatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </details>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="font-semibold">Formulários e captura</h3>
                      <p className="text-sm text-muted-foreground">
                        Escolha um formulário para conectar as respostas ao CRM.
                      </p>
                    </div>
                    {formsQuery.data?.length ? (
                      <Badge variant="secondary" className="w-fit">
                        {formsQuery.data.length}{" "}
                        {formsQuery.data.length === 1 ? "formulário" : "formulários"}
                      </Badge>
                    ) : null}
                  </div>
                  {formsQuery.isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : formsQuery.isError ? (
                    <Alert variant="destructive">
                      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                        Não foi possível carregar os formulários.
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void formsQuery.refetch()}
                        >
                          Tentar novamente
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : formsQuery.data?.length ? (
                    <div
                      className={
                        mappingForm
                          ? "rounded-lg border"
                          : "max-h-[32rem] overflow-y-auto rounded-lg border"
                      }
                    >
                      {formsQuery.data.map((form) => {
                      const questionOptions = addCurrentQuestion(
                        getMetaQuestions(form.questions),
                        mappingValues.phone,
                      );
                      const customFieldOptions = [
                        ...(assistantQuery.data?.customFields ?? []),
                        ...mappingValues.custom
                          .filter(
                            (field) =>
                              field.customerCustomFieldId &&
                              !(assistantQuery.data?.customFields ?? []).some(
                                (customField) =>
                                  customField.id ===
                                  field.customerCustomFieldId,
                              ),
                          )
                          .map((field) => ({
                            id: field.customerCustomFieldId,
                            label: field.customerCustomFieldId,
                            name: field.customerCustomFieldId,
                          })),
                      ];
                      const pageIsSelected = Boolean(
                        data?.pages.some(
                          (page) => page.pageId === form.pageId && page.selected,
                        ),
                      );
                        return (
                          <div key={form.id} className="border-b p-4 last:border-b-0">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="font-medium">{form.name}</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  Página {form.pageName ?? form.pageId}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {form.mapping?.active
                                    ? "Respostas conectadas ao CRM"
                                    : "Ainda não conectado ao CRM"}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  form.mapping?.active ? "default" : "outline"
                                }
                                className="w-fit shrink-0"
                              >
                                {form.mapping?.active
                                  ? "Ativo"
                                  : "Configuração pendente"}
                              </Badge>
                            </div>
                        {canManageIntegration &&
                          workspaceId &&
                          pageIsSelected &&
                          (!form.mapping ||
                            form.mapping.workspaceId === workspaceId) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-4"
                              onClick={() => {
                                if (mappingForm === form.id) {
                                  setMappingForm(null);
                                  return;
                                }
                                setMappingForm(form.id);
                                setMappingValues({
                                  phone: form.mapping?.fields.phone ?? "",
                                  name: form.mapping?.fields.name ?? "",
                                  email: form.mapping?.fields.email ?? "",
                                  pipelineId: form.mapping?.pipelineId ?? "",
                                  stageId: form.mapping?.stageId ?? "",
                                  custom: form.mapping?.fields.custom ?? [],
                                });
                              }}
                            >
                              {mappingForm === form.id
                                ? "Fechar configuração"
                                : "Configurar conexão"}
                            </Button>
                            {mappingForm === form.id && (
                              <div className="mt-3 grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
                                <datalist id={`meta-questions-${form.id}`}>
                                  {questionOptions.map((question) => (
                                    <option
                                      key={question.key}
                                      value={question.key}
                                    >
                                      {question.label}
                                    </option>
                                  ))}
                                </datalist>
                                <div className="space-y-1 sm:col-span-2">
                                  <p className="font-medium">Conectar campos ao CRM</p>
                                  <p className="text-sm text-muted-foreground">
                                    Indique onde cada resposta do formulário deve ser
                                    salva. Esta configuração vale para o workspace
                                    atual.
                                  </p>
                                </div>
                                {pipelinesQuery.isError && (
                                  <Alert
                                    variant="destructive"
                                    className="sm:col-span-2"
                                  >
                                    <AlertDescription>
                                      Não foi possível carregar os pipelines.
                                    </AlertDescription>
                                  </Alert>
                                )}
                                {stagesQuery.isError && (
                                  <Alert
                                    variant="destructive"
                                    className="sm:col-span-2"
                                  >
                                    <AlertDescription>
                                      Não foi possível carregar as etapas.
                                    </AlertDescription>
                                  </Alert>
                                )}
                                {assistantQuery.isError && (
                                  <Alert
                                    variant="destructive"
                                    className="sm:col-span-2"
                                  >
                                    <AlertDescription>
                                      Não foi possível carregar os campos personalizados
                                      do assistente.
                                    </AlertDescription>
                                  </Alert>
                                )}
                                <label className="space-y-1 text-sm">
                                  <span className="font-medium">
                                    Telefone <span className="text-destructive">*</span>
                                  </span>
                                  <span className="block text-xs text-muted-foreground">
                                    Pergunta do formulário usada para falar com o lead.
                                  </span>
                                  <Input
                                    list={`meta-questions-${form.id}`}
                                    value={mappingValues.phone}
                                    onChange={(event) =>
                                      setMappingValues((current) => ({
                                        ...current,
                                        phone: event.target.value,
                                      }))
                                    }
                                  />
                                </label>
                                <label className="space-y-1 text-sm">
                                  <span className="font-medium">Nome <span className="font-normal text-muted-foreground">(opcional)</span></span>
                                  <Input
                                    list={`meta-questions-${form.id}`}
                                    value={mappingValues.name}
                                    onChange={(event) =>
                                      setMappingValues((current) => ({
                                        ...current,
                                        name: event.target.value,
                                      }))
                                    }
                                  />
                                </label>
                                <label className="space-y-1 text-sm">
                                  <span className="font-medium">E-mail <span className="font-normal text-muted-foreground">(opcional)</span></span>
                                  <Input
                                    list={`meta-questions-${form.id}`}
                                    value={mappingValues.email}
                                    onChange={(event) =>
                                      setMappingValues((current) => ({
                                        ...current,
                                        email: event.target.value,
                                      }))
                                    }
                                  />
                                </label>
                                <label className="space-y-1 text-sm">
                                  <span className="font-medium">Pipeline de destino</span>
                                  <Select
                                    value={mappingValues.pipelineId || undefined}
                                    onValueChange={(value) =>
                                      setMappingValues((current) => ({
                                        ...current,
                                        pipelineId: value,
                                        stageId: "",
                                      }))
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Escolha um pipeline" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(pipelinesQuery.data ?? []).map(
                                        (pipeline) => (
                                          <SelectItem
                                            key={pipeline.id}
                                            value={pipeline.id}
                                          >
                                            {pipeline.name}
                                          </SelectItem>
                                        ),
                                      )}
                                    </SelectContent>
                                  </Select>
                                </label>
                                <label className="space-y-1 text-sm">
                                  <span className="font-medium">Etapa inicial</span>
                                  <Select
                                    value={mappingValues.stageId || undefined}
                                    onValueChange={(value) =>
                                      setMappingValues((current) => ({
                                        ...current,
                                        stageId: value,
                                      }))
                                    }
                                    disabled={
                                      !mappingValues.pipelineId ||
                                      stagesQuery.isLoading
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue
                                        placeholder={
                                          stagesQuery.isLoading
                                            ? "Carregando etapas..."
                                            : "Escolha uma etapa"
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(stagesQuery.data ?? []).map((stage) => (
                                        <SelectItem
                                          key={stage.id}
                                          value={stage.id}
                                        >
                                          {stage.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </label>
                                <div className="space-y-3 sm:col-span-2">
                                  <div>
                                    <p className="font-medium text-sm">
                                      Campos personalizados <span className="font-normal text-muted-foreground">(opcional)</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Use somente se o formulário tiver perguntas
                                      adicionais que também devam ir para o CRM.
                                    </p>
                                  </div>
                                  {mappingValues.custom.map((field, index) => (
                                    <div
                                      className="grid items-end gap-2 rounded-md border bg-background p-3 sm:grid-cols-[1fr_1fr_auto]"
                                      key={`${field.metaField}-${index}`}
                                    >
                                      <label className="space-y-1 text-sm">
                                        <span className="font-medium">Resposta do formulário</span>
                                        <Input
                                          aria-label="Resposta do formulário"
                                          placeholder="Ex.: cargo"
                                          list={`meta-questions-${form.id}`}
                                          value={field.metaField}
                                          onChange={(event) =>
                                            setMappingValues((current) => ({
                                              ...current,
                                              custom: current.custom.map(
                                                (item, itemIndex) =>
                                                  itemIndex === index
                                                    ? {
                                                        ...item,
                                                        metaField:
                                                          event.target.value,
                                                      }
                                                    : item,
                                              ),
                                            }))
                                          }
                                        />
                                      </label>
                                      <label className="space-y-1 text-sm">
                                        <span className="font-medium">Campo do CRM</span>
                                        <Select
                                          value={
                                            field.customerCustomFieldId || undefined
                                          }
                                          onValueChange={(value) =>
                                            setMappingValues((current) => ({
                                              ...current,
                                              custom: current.custom.map(
                                                (item, itemIndex) =>
                                                  itemIndex === index
                                                    ? {
                                                        ...item,
                                                        customerCustomFieldId:
                                                          value,
                                                      }
                                                    : item,
                                              ),
                                            }))
                                          }
                                        >
                                          <SelectTrigger aria-label="Campo do CRM">
                                            <SelectValue placeholder="Escolha o campo" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {customFieldOptions.map((fieldOption) => (
                                              <SelectItem
                                                key={fieldOption.id}
                                                value={fieldOption.id}
                                              >
                                                {fieldOption.label || fieldOption.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </label>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        className="text-muted-foreground hover:text-destructive"
                                        aria-label={`Remover campo personalizado ${index + 1}`}
                                        onClick={() =>
                                          setMappingValues((current) => ({
                                            ...current,
                                            custom: current.custom.filter(
                                              (_, itemIndex) =>
                                                itemIndex !== index,
                                            ),
                                          }))
                                        }
                                      >
                                        Remover
                                      </Button>
                                    </div>
                                  ))}
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setMappingValues((current) => ({
                                        ...current,
                                        custom: [
                                          ...current.custom,
                                          {
                                            metaField: "",
                                            customerCustomFieldId: "",
                                          },
                                        ],
                                      }))
                                    }
                                  >
                                    Adicionar campo personalizado
                                  </Button>
                                </div>
                                {mappingValidationErrors.length > 0 && (
                                  <Alert className="sm:col-span-2">
                                    <AlertDescription>
                                      Para ativar o mapping, {" "}
                                      {mappingValidationErrors.join(", ")}.
                                    </AlertDescription>
                                  </Alert>
                                )}
                                <div className="flex flex-wrap gap-2 sm:col-span-2">
                                  <Button
                                    onClick={() =>
                                      mappingMutation.mutate({
                                        formId: form.id,
                                        active: true,
                                      })
                                    }
                                    disabled={
                                      mappingMutation.isPending ||
                                      deleteMappingMutation.isPending ||
                                      mappingValidationErrors.length > 0
                                    }
                                    isLoading={mappingMutation.isPending}
                                  >
                                    <Save /> Ativar mapping
                                  </Button>
                                  {form.mapping?.active && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() =>
                                        deleteMappingMutation.mutate(form.id)
                                      }
                                      disabled={
                                        mappingMutation.isPending ||
                                        deleteMappingMutation.isPending
                                      }
                                      isLoading={deleteMappingMutation.isPending}
                                    >
                                      <Trash2 /> Desativar mapping
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        {canManageIntegration &&
                          workspaceId &&
                          !pageIsSelected && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Selecione a Página nos ativos para configurar o
                              mapping.
                            </p>
                          )}
                        {canManageIntegration &&
                          workspaceId &&
                          pageIsSelected &&
                          form.mapping &&
                          form.mapping.workspaceId !== workspaceId && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Mapping configurado em outro workspace.
                            </p>
                          )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum formulário disponível. Sincronize as Páginas
                      selecionadas.
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">Atividade de Lead Ads</h3>
                      <p className="text-sm text-muted-foreground">
                        Acompanhe eventos que precisam de revisão ou reprocessamento.
                        A lista é paginada para continuar leve mesmo com muitos leads.
                      </p>
                    </div>
                    <Select
                      value={eventsStatus}
                      onValueChange={(value) => {
                        setEventsStatus(value as MetaLeadEventStatus | "ALL");
                        setEventsPage(1);
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {eventsQuery.isError ? (
                    <Alert variant="destructive">
                      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                        Não foi possível carregar as pendências.
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void eventsQuery.refetch()}
                        >
                          Tentar novamente
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : eventsQuery.isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : pendingEvents.length ? (
                    <div className="max-h-[22rem] space-y-2 overflow-y-auto rounded-lg border p-2">
                      {pendingEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex flex-col gap-3 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant={
                                  event.status === "FAILED_PERMANENT"
                                    ? "destructive"
                                    : "outline"
                                }
                              >
                                {eventStatusLabel[event.status] ?? event.status}
                              </Badge>
                              <p className="truncate text-sm font-medium">
                                {event.formExternalId ?? "Formulário não identificado"}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Recebido{" "}
                              {event.eventTime
                                ? new Date(event.eventTime).toLocaleString()
                                : "sem data"}
                              {event.errorCode ? ` · ${event.errorCode}` : ""}
                            </p>
                            <details className="text-xs text-muted-foreground">
                              <summary className="cursor-pointer hover:text-foreground">
                                Ver identificador técnico
                              </summary>
                              <p className="mt-1 break-all">Lead ID: {event.leadgenId}</p>
                            </details>
                          </div>
                          <div className="flex flex-wrap gap-2 sm:justify-end">
                            {event.status === "WAITING_PHONE" && (
                              <>
                                <Input
                                  aria-label="Telefone do lead"
                                  placeholder="Telefone"
                                  value={phoneOverrides[event.id] ?? ""}
                                  onChange={(input) =>
                                    setPhoneOverrides((current) => ({
                                      ...current,
                                      [event.id]: input.target.value,
                                    }))
                                  }
                                  className="w-full sm:w-36"
                                />
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    phoneMutation.mutate({
                                      id: event.id,
                                      phone: phoneOverrides[event.id] ?? "",
                                    })
                                  }
                                  disabled={
                                    phoneMutation.isPending ||
                                    !phoneOverrides[event.id]?.trim()
                                  }
                                  isLoading={phoneMutation.isPending}
                                >
                                  Resolver telefone
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryMutation.mutate(event.id)}
                              disabled={
                                retryMutation.isPending || phoneMutation.isPending
                              }
                              isLoading={retryMutation.isPending}
                            >
                              <RefreshCw /> Reprocessar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma pendência operacional nesta consulta.
                    </p>
                  )}
                  {eventsQuery.data && eventsQuery.data.totalPages > 1 && (
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">
                        Página {eventsQuery.data.page} de {eventsQuery.data.totalPages}
                        {eventsQuery.isFetching ? " · atualizando..." : ""}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEventsPage((page) => page - 1)}
                          disabled={
                            eventsQuery.data.page <= 1 || eventsQuery.isFetching
                          }
                        >
                          Anterior
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEventsPage((page) => page + 1)}
                          disabled={
                            eventsQuery.data.page >= eventsQuery.data.totalPages ||
                            eventsQuery.isFetching
                          }
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AssetList<
  T extends {
    name: string;
    selected: boolean;
    leadgenSubscriptionStatus?: string;
  },
>({
  title,
  items,
  selected,
  disabled,
  keyFor,
  onToggle,
}: {
  title: string;
  items: T[];
  selected: string[];
  disabled?: boolean;
  keyFor: (item: T) => string;
  onToggle: (id: string) => void;
}) {
  const { t } = useTranslation();
  const selectedCount = items.filter((item) => item.selected).length;

  return (
    <div className="rounded-lg border bg-muted/10 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">
          {selectedCount === 1
            ? t("integrations.metaSelectedOne", { count: selectedCount })
            : t("integrations.metaSelectedMany", { count: selectedCount })}
        </span>
      </div>
      {items.length ? (
        <div className="max-h-48 space-y-2 overflow-auto">
          {items.map((item) => {
            const id = keyFor(item);
            return (
              <label
                key={id}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(id)}
                  disabled={disabled}
                  onChange={() => onToggle(id)}
                />{" "}
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                {item.leadgenSubscriptionStatus && (
                  <Badge
                    variant={
                      item.leadgenSubscriptionStatus === "SUBSCRIBED"
                        ? "default"
                        : "outline"
                    }
                  >
                    {subscriptionStatusLabel[item.leadgenSubscriptionStatus] ??
                      item.leadgenSubscriptionStatus}
                  </Badge>
                )}
              </label>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sincronize para listar ativos.
        </p>
      )}
    </div>
  );
}
