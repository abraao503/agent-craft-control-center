import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileSpreadsheet,
  Loader2,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Users,
  Calendar,
  User,
  Building2,
  RefreshCw,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCustomerImportDetail,
  downloadImportErrors,
} from "@/services/customer-import";
import { CustomerImportStatus } from "@/types/customer-import";
import { format } from "date-fns";
import { es, ptBR } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useAppLocale } from "@/i18n/LocaleProvider";

const STATUS_COLORS: Record<CustomerImportStatus, string> = {
  PENDING: "bg-gray-100 text-gray-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
};

export default function CustomerImportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { locale } = useAppLocale();
  const dateLocale = locale === "es-ES" ? es : ptBR;
  const [isDownloadingErrors, setIsDownloadingErrors] = useState(false);

  const getStatusLabel = (status: CustomerImportStatus) => {
    const labels: Record<CustomerImportStatus, string> = {
      PENDING: t("customerImport.pending"),
      PROCESSING: t("customerImport.processing"),
      COMPLETED: t("customerImport.completed"),
      FAILED: t("customerImport.failed"),
    };
    return labels[status];
  };

  const {
    data: importDetail,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customer-import", id],
    queryFn: () => getCustomerImportDetail(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Polling enquanto estiver pendente ou processando
      if (data?.status === "PENDING" || data?.status === "PROCESSING") {
        return 5000;
      }
      return false;
    },
  });

  const handleDownloadErrors = async () => {
    if (!id) return;
    setIsDownloadingErrors(true);
    try {
      const blob = await downloadImportErrors(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${id}-erros-importacao.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: t("customerImport.downloadStarted"),
        description: t("customerImport.downloadStartedDescription"),
      });
    } catch {
      toast({
        title: t("customerImport.downloadError"),
        description: t("customerImport.downloadErrorDescription"),
        variant: "destructive",
      });
    } finally {
      setIsDownloadingErrors(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm:ss", { locale: dateLocale });
  };

  const getProgressPercent = () => {
    if (!importDetail || importDetail.totalRows === 0) return 0;
    return Math.round(
      (importDetail.processedCount / importDetail.totalRows) * 100,
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !importDetail) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/customer-imports")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("common.back")}
        </Button>
        <div className="bg-red-50 p-6 rounded-md border border-red-200 text-center">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            {t("customerImport.notFound")}
          </h3>
          <p className="text-red-600">
            {t("customerImport.notFoundDescription")}
          </p>
        </div>
      </div>
    );
  }

  const progress = getProgressPercent();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/customer-imports")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">{importDetail.fileName}</h1>
              <Badge
                variant="secondary"
                className={STATUS_COLORS[importDetail.status]}
              >
                {getStatusLabel(importDetail.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 ml-9">
              {t("customerImport.detailDescription")}
            </p>
          </div>
        </div>

        {/* Botão de download de erros */}
        {importDetail.hasErrors && importDetail.status === "COMPLETED" && (
          <Button
            variant="outline"
            onClick={handleDownloadErrors}
            disabled={isDownloadingErrors}
            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
          >
            {isDownloadingErrors ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {t("customerImport.downloadErrors")}
          </Button>
        )}
      </div>

      {/* Status de processamento */}
      {(importDetail.status === "PENDING" ||
        importDetail.status === "PROCESSING") && (
        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-300">
                {importDetail.status === "PENDING"
                  ? t("customerImport.processingWaiting")
                  : t("customerImport.processingInProgress")}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {t("customerImport.autoRefresh")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem de erro geral */}
      {importDetail.status === "FAILED" && importDetail.errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-md border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">
                {t("customerImport.processingFailure")}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                {importDetail.errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cards de métricas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{importDetail.totalRows}</p>
                <p className="text-sm text-muted-foreground">{t("customerImport.totalRows")}</p>
              </div>
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {importDetail.successCount}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("customerImport.importedSuccess")}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {importDetail.errorCount}
                </p>
                <p className="text-sm text-muted-foreground">{t("customerImport.errors")}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {importDetail.processedCount}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("customerImport.totalProcessed")}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de progresso */}
      {importDetail.totalRows > 0 && importDetail.status !== "COMPLETED" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("customerImport.progress")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {t("customerImport.processed", {
                    processed: importDetail.processedCount,
                    total: importDetail.totalRows,
                  })}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-primary rounded-full h-3 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {importDetail.errorCount > 0 && (
                <p className="text-xs text-red-600">
                  {t("customerImport.recordsWithErrors", { count: importDetail.errorCount })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalhes da importação */}
      <Card>
        <CardHeader>
          <CardTitle>{t("customerImport.information")}</CardTitle>
          <CardDescription>
            {t("customerImport.informationDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" /> {t("customerImport.uploadDate")}
              </Label>
              <p className="font-medium">
                {formatDate(importDetail.createdAt)}
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> {t("customerImport.processingStart")}
              </Label>
              <p className="font-medium">
                {formatDate(importDetail.startedAt)}
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> {t("customerImport.completion")}
              </Label>
              <p className="font-medium">
                {formatDate(importDetail.completedAt)}
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" /> {t("customerImport.file")}
              </Label>
              <p className="font-medium">{importDetail.fileName}</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" /> {t("customerImport.createdBy")}
              </Label>
              <p className="font-medium">{importDetail.createdBy.name}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" /> {t("customerImport.workspace")}
              </Label>
              <p className="font-medium">{importDetail.workspace.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
