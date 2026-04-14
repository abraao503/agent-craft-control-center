import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Copy,
  Edit,
  Webhook,
  Loader2,
  FileText,
  History,
  Settings,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getDealWebhook,
  listDealWebhookExecutions,
} from "@/services/deal-webhook";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatPhone } from "@/utils/phone";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SmartPagination } from "@/components/common/SmartPagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type {
  DealWebhookExecutionStatus,
  DealWebhookExecution,
} from "@/types/deal-webhook";

export default function DealWebhookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [executionsPage, setExecutionsPage] = useState(0);
  const [executionsLimit] = useState(10);
  const [statusFilter, setStatusFilter] =
    useState<DealWebhookExecutionStatus>();
  const [selectedExecution, setSelectedExecution] =
    useState<DealWebhookExecution | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isErrorDetailsOpen, setIsErrorDetailsOpen] = useState(false);

  const {
    data: webhook,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["deal-webhook", id],
    queryFn: () => getDealWebhook(id!),
    enabled: !!id,
  });

  const {
    data: executionsData,
    isLoading: isLoadingExecutions,
    refetch: refetchExecutions,
  } = useQuery({
    queryKey: ["deal-webhook-executions", id, executionsPage, statusFilter],
    queryFn: () =>
      listDealWebhookExecutions(id!, {
        page: executionsPage + 1,
        limit: executionsLimit,
        status: statusFilter,
      }),
    enabled: !!id,
  });

  const handleCopyUrl = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência.",
    });
  };

  const getStatusTranslation = (
    status: DealWebhookExecutionStatus,
  ): { label: string; description: string } => {
    const translations = {
      pending: {
        label: "Aguardando Processamento",
        description:
          "A requisição foi recebida e está aguardando ser processada.",
      },
      processing: {
        label: "Processando",
        description: "A requisição está sendo processada no momento.",
      },
      success: {
        label: "Concluído com Sucesso",
        description:
          "O negócio foi criado com sucesso e todas as operações foram concluídas.",
      },
      success_with_warnings: {
        label: "Concluído com Avisos",
        description:
          "O negócio foi criado, mas algumas operações secundárias (como envio de mensagens) apresentaram problemas.",
      },
      failed: {
        label: "Falhou",
        description: "Não foi possível processar a requisição devido a erros.",
      },
    };
    return translations[status];
  };

  const getErrorTranslation = (
    errorCode: string,
  ): { title: string; description: string } => {
    const translations: Record<string, { title: string; description: string }> =
      {
        // Erros de Processamento de Deal
        DEAL_ALREADY_EXISTS: {
          title: "Negócio Já Existe",
          description:
            "Este cliente já possui um negócio ativo nesta pipeline.",
        },
        PIPELINE_NOT_FOUND: {
          title: "Pipeline Não Encontrada",
          description: "A pipeline especificada não foi encontrada no sistema.",
        },
        PIPELINE_STAGE_NOT_FOUND: {
          title: "Etapa Não Encontrada",
          description: "A etapa da pipeline especificada não foi encontrada.",
        },
        PIPELINE_STAGE_MISMATCH: {
          title: "Etapa Incompatível",
          description:
            "A etapa selecionada não pertence à pipeline especificada.",
        },
        CUSTOMER_CREATION_FAILED: {
          title: "Erro ao Processar Cliente",
          description:
            "Não foi possível criar ou localizar o cliente no sistema.",
        },
        DEAL_CREATION_FAILED: {
          title: "Erro ao Criar Negócio",
          description: "Ocorreu um erro ao tentar criar o negócio no sistema.",
        },
        INTERNAL_ERROR: {
          title: "Erro Interno",
          description: "Ocorreu um erro inesperado no processamento.",
        },
        // Erros de Automação
        DEAL_NOT_FOUND: {
          title: "Negócio Não Encontrado",
          description: "O negócio não foi encontrado para enviar a automação.",
        },
        WHATSAPP_INTEGRATION_NOT_CONFIGURED: {
          title: "WhatsApp Não Configurado",
          description:
            "A integração com WhatsApp não está configurada para este funil.",
        },
        CHAT_CREATION_FAILED: {
          title: "Erro ao Criar Conversa",
          description: "Não foi possível criar a conversa no WhatsApp.",
        },
        MESSAGE_SEND_FAILED: {
          title: "Erro ao Enviar Mensagem",
          description: "A mensagem de boas-vindas não pôde ser enviada.",
        },
        MESSAGE_RECORD_FAILED: {
          title: "Erro ao Registrar Mensagem",
          description:
            "A mensagem foi enviada, mas não foi registrada no banco de dados.",
        },
      };

    return (
      translations[errorCode] || {
        title: "Erro Desconhecido",
        description:
          "Ocorreu um erro não identificado durante o processamento.",
      }
    );
  };

  const parseErrorMessage = (errorMessage: string | null) => {
    if (!errorMessage) return null;

    try {
      const parsed = JSON.parse(errorMessage);
      return {
        code: parsed.code || "UNKNOWN",
        message: parsed.message || errorMessage,
        metadata: parsed.metadata || {},
        isRecoverable: parsed.isRecoverable ?? false,
      };
    } catch {
      // Se não for JSON, retorna como string simples
      return {
        code: "UNKNOWN",
        message: errorMessage,
        metadata: {},
        isRecoverable: false,
      };
    }
  };

  const handleOpenErrorModal = (execution: DealWebhookExecution) => {
    setSelectedExecution(execution);
    setIsErrorModalOpen(true);
    setIsErrorDetailsOpen(false);
  };

  const handleCloseErrorModal = () => {
    setIsErrorModalOpen(false);
    setSelectedExecution(null);
    setIsErrorDetailsOpen(false);
  };

  const handleGoBack = () => {
    navigate("/webhooks");
  };

  const getStatusBadge = (status: DealWebhookExecutionStatus) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const },
      processing: { label: "Processando", variant: "default" as const },
      success: { label: "Sucesso", variant: "default" as const },
      success_with_warnings: {
        label: "Sucesso com Avisos",
        variant: "secondary" as const,
      },
      failed: { label: "Falhou", variant: "destructive" as const },
    };

    const config = statusConfig[status];
    const isSuccess = status === "success";
    const isWarning = status === "success_with_warnings";

    return (
      <Badge
        variant={config.variant}
        className={
          isSuccess
            ? "bg-green-100 text-green-800 hover:bg-green-100"
            : isWarning
              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
              : ""
        }
      >
        {config.label}
      </Badge>
    );
  };

  const handleStatusFilterChange = (value: string) => {
    setExecutionsPage(0);
    setStatusFilter(
      value === "all" ? undefined : (value as DealWebhookExecutionStatus),
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !webhook) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoBack}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Webhook</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              Webhook não encontrado ou ocorreu um erro ao carregar.
            </p>
            <Button onClick={handleGoBack} className="mt-4">
              Voltar para lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const examplePayload = {
    title: "Nome do negócio",
    description: "Descrição opcional do negócio",
    value: 1000,
    customerName: "João Silva",
    customerPhone: "+5511999887766",
    customerEmail: "joao.silva@exemplo.com",
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoBack}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Webhook className="h-8 w-8" />
              {webhook.name}
            </h1>
            <p className="text-muted-foreground">
              Detalhes e documentação do webhook
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={webhook.status === "ACTIVE" ? "default" : "secondary"}
            className={
              webhook.status === "ACTIVE"
                ? "bg-green-100 text-green-800 hover:bg-green-100"
                : ""
            }
          >
            {webhook.status === "ACTIVE" ? "Ativo" : "Inativo"}
          </Badge>
          <Button
            variant="outline"
            onClick={() => navigate(`/webhooks/${webhook.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" /> Editar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>

            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de envios
            </TabsTrigger>
            <TabsTrigger
              value="documentation"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Documentação
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Nome
                    </Label>
                    <p className="font-medium">{webhook.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Status
                    </Label>
                    <p>
                      <Badge
                        variant={
                          webhook.status === "ACTIVE" ? "default" : "secondary"
                        }
                        className={
                          webhook.status === "ACTIVE"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : ""
                        }
                      >
                        {webhook.status === "ACTIVE" ? "Ativo" : "Inativo"}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Criado em
                    </Label>
                    <p className="font-medium">
                      {format(webhook.createdAt, "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Atualizado em
                    </Label>
                    <p className="font-medium">
                      {format(webhook.updatedAt, "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>

                {webhook.automation?.sendWelcomeMessage && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <Label className="text-sm text-muted-foreground">
                      Mensagem de boas-vindas
                    </Label>
                    <p className="mt-1">{webhook.automation.welcomeMessage}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pipeline and Stage Info */}
            <Card>
              <CardHeader>
                <CardTitle>Configuração da Pipeline</CardTitle>
                <CardDescription>
                  Os negócios criados por este webhook serão adicionados nesta
                  pipeline e etapa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Pipeline
                    </Label>
                    <p className="font-medium mt-1">{webhook.pipeline.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Etapa
                    </Label>
                    <p className="font-medium mt-1">
                      {webhook.stage
                        ? webhook.stage.name
                        : "Primeira etapa da pipeline"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Histórico */}
        <TabsContent value="history" className="space-y-6 mt-6">
          <div className="max-w-6xl mx-auto">
            {/* Webhook Executions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Histórico de Execuções</CardTitle>
                    <CardDescription>
                      Últimas execuções deste webhook
                    </CardDescription>
                  </div>
                  <Select
                    value={statusFilter || "all"}
                    onValueChange={handleStatusFilterChange}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="processing">Processando</SelectItem>
                      <SelectItem value="success">Sucesso</SelectItem>
                      <SelectItem value="success_with_warnings">
                        Sucesso com Avisos
                      </SelectItem>
                      <SelectItem value="failed">Falhou</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingExecutions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : executionsData && executionsData.items.length > 0 ? (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Título do Negócio</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {executionsData.items.map((execution) => (
                            <TableRow key={execution.id}>
                              <TableCell>
                                {getStatusBadge(execution.status)}
                              </TableCell>
                              <TableCell className="font-medium">
                                {execution.payload.title}
                              </TableCell>
                              <TableCell>
                                {execution.payload.customerName || "-"}
                              </TableCell>
                              <TableCell>
                                {formatPhone(execution.payload.customerPhone)}
                              </TableCell>
                              <TableCell>
                                {format(
                                  execution.createdAt,
                                  "dd/MM/yyyy 'às' HH:mm",
                                  {
                                    locale: ptBR,
                                  },
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenErrorModal(execution)
                                  }
                                >
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Ver Detalhes
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {executionsData.totalPages > 1 && (
                      <div className="mt-4">
                        <SmartPagination
                          currentPage={executionsPage}
                          totalPages={executionsData.totalPages}
                          onPageChange={setExecutionsPage}
                          showItemCount
                          itemsPerPage={executionsLimit}
                          totalItems={executionsData.total}
                          itemLabel="execuções"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Nenhuma execução encontrada</p>
                    {statusFilter && (
                      <Button
                        variant="link"
                        onClick={() => handleStatusFilterChange("all")}
                        className="mt-2"
                      >
                        Limpar filtro
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Documentação */}
        <TabsContent value="documentation" className="space-y-6 mt-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Webhook URL */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  URL do Webhook
                </CardTitle>
                <CardDescription>
                  Use esta URL para enviar requisições e criar negócios
                  automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Endpoint</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
                      {webhook.webhookUrl}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopyUrl(webhook.webhookUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Método HTTP</Label>
                  <div className="mt-1">
                    <code className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-semibold">
                      POST
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Documentation */}
            <Card>
              <CardHeader>
                <CardTitle>Documentação da API</CardTitle>
                <CardDescription>
                  Exemplo de como fazer uma requisição para este webhook
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Headers
                  </Label>
                  <div className="bg-muted p-4 rounded-lg relative">
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(
                        {
                          "Content-Type": "application/json",
                        },
                        null,
                        2,
                      )}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        handleCopyUrl(
                          JSON.stringify(
                            { "Content-Type": "application/json" },
                            null,
                            2,
                          ),
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Body (JSON)
                  </Label>
                  <div className="bg-muted p-4 rounded-lg relative">
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(examplePayload, null, 2)}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        handleCopyUrl(JSON.stringify(examplePayload, null, 2))
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Campos do Body
                  </Label>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2 p-2 bg-muted/50 rounded font-medium">
                      <span>Campo</span>
                      <span>Tipo</span>
                      <span>Obrigatório</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2">
                      <code>title</code>
                      <span>string</span>
                      <span className="text-green-600">Sim</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2 bg-muted/30">
                      <code>customerPhone</code>
                      <span>string (formato internacional)</span>
                      <span className="text-green-600">Sim</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2">
                      <code>description</code>
                      <span>string</span>
                      <span className="text-muted-foreground">Não</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2 bg-muted/30">
                      <code>value</code>
                      <span>number</span>
                      <span className="text-muted-foreground">Não</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2">
                      <code>customerName</code>
                      <span>string</span>
                      <span className="text-muted-foreground">Não</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2 bg-muted/30">
                      <code>customerEmail</code>
                      <span>email</span>
                      <span className="text-muted-foreground">Não</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Observações Importantes
                  </Label>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>
                      O telefone aceita formato internacional com DDI (ex:
                      +5511999887766, +16505551234). Números sem DDI são
                      assumidos como brasileiros.
                    </li>
                    <li>
                      O campo{" "}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        title
                      </code>{" "}
                      é obrigatório e será o nome do negócio
                    </li>
                    <li>
                      O campo{" "}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        customerPhone
                      </code>{" "}
                      é obrigatório
                    </li>
                    <li>Todos os outros campos são opcionais</li>
                    <li>
                      A pipeline e etapa são configuradas no webhook e aplicadas
                      automaticamente
                    </li>
                  </ul>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Configuração do Webhook
                  </Label>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">Pipeline:</span>
                      <span className="font-medium">
                        {webhook.pipeline.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">Etapa:</span>
                      <span className="font-medium">
                        {webhook.stage
                          ? webhook.stage.name
                          : "Primeira etapa da pipeline"}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Exemplo com cURL
                  </Label>
                  <div className="bg-muted p-4 rounded-lg relative">
                    <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                      {`curl -X POST "${webhook.webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(examplePayload)}'`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        handleCopyUrl(
                          `curl -X POST "${webhook.webhookUrl}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(examplePayload)}'`,
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Resposta de Sucesso (202 Accepted)
                  </Label>
                  <div className="bg-mated p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(
                        {
                          success: true,
                          data: {
                            executionId: "uuid",
                            message:
                              "Webhook received and queued for processing",
                          },
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes da Execução */}
      <Dialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Detalhes da Execução
            </DialogTitle>
            <DialogDescription>
              Informações completas sobre o processamento desta requisição
            </DialogDescription>
          </DialogHeader>

          {selectedExecution && (
            <div className="space-y-4">
              {/* Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedExecution.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {getStatusTranslation(selectedExecution.status).description}
                </p>
              </div>

              <Separator />

              {/* Data e Hora */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data e Hora</Label>
                <p className="text-sm">
                  {format(
                    selectedExecution.createdAt,
                    "dd/MM/yyyy 'às' HH:mm:ss",
                    {
                      locale: ptBR,
                    },
                  )}
                </p>
              </div>

              {/* Detalhes do Erro (se houver) */}
              {selectedExecution.errorMessage &&
                (() => {
                  const parsedError = parseErrorMessage(
                    selectedExecution.errorMessage,
                  );
                  const errorTranslation = parsedError
                    ? getErrorTranslation(parsedError.code)
                    : null;

                  return (
                    <>
                      <Separator />

                      {/* Erro Traduzido */}
                      {errorTranslation && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            O que aconteceu?
                          </Label>
                          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                              {errorTranslation.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {errorTranslation.description}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Detalhes Técnicos Colapsáveis */}
                      <Collapsible
                        open={isErrorDetailsOpen}
                        onOpenChange={setIsErrorDetailsOpen}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                          >
                            <span className="flex items-center gap-2 text-sm">
                              Detalhes Técnicos
                            </span>
                            {isErrorDetailsOpen ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
                            {parsedError && (
                              <>
                                <div>
                                  <span className="text-xs text-muted-foreground">
                                    Código:
                                  </span>
                                  <p className="text-sm font-mono text-destructive">
                                    {parsedError.code}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground">
                                    Mensagem:
                                  </span>
                                  <p className="text-sm font-mono break-words">
                                    {parsedError.message}
                                  </p>
                                </div>
                                {Object.keys(parsedError.metadata).length >
                                  0 && (
                                  <div>
                                    <span className="text-xs text-muted-foreground">
                                      Informações Adicionais:
                                    </span>
                                    <pre className="text-xs font-mono mt-1 overflow-x-auto">
                                      {JSON.stringify(
                                        parsedError.metadata,
                                        null,
                                        2,
                                      )}
                                    </pre>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </>
                  );
                })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
