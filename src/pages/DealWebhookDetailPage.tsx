import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Edit, FileText, History, Loader2, Settings, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getDealWebhook,
  listDealWebhookExecutions,
} from "@/services/deal-webhook";
import type {
  DealWebhookExecution,
  DealWebhookExecutionStatus,
} from "@/types/deal-webhook";
import { useToast } from "@/components/ui/use-toast";
import { DealWebhookOverview } from "@/components/deal-webhooks/DealWebhookOverview";
import { DealWebhookExecutions } from "@/components/deal-webhooks/DealWebhookExecutions";
import { DealWebhookDocumentation } from "@/components/deal-webhooks/DealWebhookDocumentation";
import { DealWebhookExecutionDialog } from "@/components/deal-webhooks/DealWebhookExecutionDialog";
import { useTranslation } from "react-i18next";

export default function DealWebhookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [executionsPage, setExecutionsPage] = useState(0);
  const executionsLimit = 10;
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
    enabled: Boolean(id),
  });

  const { data: executionsData, isLoading: isLoadingExecutions } = useQuery({
    queryKey: ["deal-webhook-executions", id, executionsPage, statusFilter],
    queryFn: () =>
      listDealWebhookExecutions(id!, {
        page: executionsPage + 1,
        limit: executionsLimit,
        status: statusFilter,
      }),
    enabled: Boolean(id),
  });

  const handleGoBack = () => navigate("/webhooks");

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t("webhookForm.copied"),
      description: t("webhookForm.copiedDescription"),
    });
  };

  const handleStatusFilterChange = (value: string) => {
    setExecutionsPage(0);
    setStatusFilter(
      value === "all" ? undefined : (value as DealWebhookExecutionStatus),
    );
  };

  const handleOpenExecutionDetails = (execution: DealWebhookExecution) => {
    setSelectedExecution(execution);
    setIsErrorModalOpen(true);
    setIsErrorDetailsOpen(false);
  };

  const handleErrorModalChange = (open: boolean) => {
    setIsErrorModalOpen(open);
    if (!open) {
      setSelectedExecution(null);
      setIsErrorDetailsOpen(false);
    }
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
              {t("legacy.Webhook não encontrado ou ocorreu um erro ao carregar.")}
            </p>
            <Button onClick={handleGoBack} className="mt-4">
              {t("webhookForm.backToList")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              {t("webhookForm.detailDescription")}
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
            {webhook.status === "ACTIVE"
              ? t("webhooks.active")
              : t("webhooks.inactive")}
          </Badge>
          <Button
            variant="outline"
            onClick={() => navigate(`/webhooks/${webhook.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" /> {t("webhookForm.editButton")}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t("webhookForm.overviewTab")}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              {t("webhookForm.historyTab")}
            </TabsTrigger>
            <TabsTrigger
              value="documentation"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {t("webhookForm.documentationTab")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <DealWebhookOverview webhook={webhook} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-6">
          <DealWebhookExecutions
            data={executionsData}
            isLoading={isLoadingExecutions}
            statusFilter={statusFilter}
            page={executionsPage}
            limit={executionsLimit}
            onStatusFilterChange={handleStatusFilterChange}
            onPageChange={setExecutionsPage}
            onOpenDetails={handleOpenExecutionDetails}
          />
        </TabsContent>

        <TabsContent value="documentation" className="space-y-6 mt-6">
          <DealWebhookDocumentation webhook={webhook} onCopy={handleCopy} />
        </TabsContent>
      </Tabs>

      <DealWebhookExecutionDialog
        open={isErrorModalOpen}
        execution={selectedExecution}
        technicalDetailsOpen={isErrorDetailsOpen}
        onOpenChange={handleErrorModalChange}
        onTechnicalDetailsChange={setIsErrorDetailsOpen}
      />
    </div>
  );
}
