import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileSpreadsheet,
  Eye,
  Download,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SmartPagination } from "@/components/common/SmartPagination";
import {
  listCustomerImports,
  uploadCustomerImport,
  downloadImportTemplate,
} from "@/services/customer-import";
import { CustomerImport, CustomerImportStatus } from "@/types/customer-import";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ITEMS_PER_PAGE = 10;

const STATUS_LABELS: Record<CustomerImportStatus, string> = {
  PENDING: "Pendente",
  PROCESSING: "Processando",
  COMPLETED: "Concluída",
  FAILED: "Falhou",
};

const STATUS_COLORS: Record<CustomerImportStatus, string> = {
  PENDING: "bg-gray-100 text-gray-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
};

const STATUS_ICONS: Record<CustomerImportStatus, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  PROCESSING: <Loader2 className="h-4 w-4 animate-spin" />,
  COMPLETED: <CheckCircle2 className="h-4 w-4" />,
  FAILED: <XCircle className="h-4 w-4" />,
};

export default function CustomerImportPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const workspaceId = currentWorkspace?.id || "";

  const [currentPage, setCurrentPage] = useState(1);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: importsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customer-imports", workspaceId, currentPage],
    queryFn: () =>
      listCustomerImports({
        workspaceId,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      }),
    enabled: !!workspaceId,
    refetchInterval: 10000, // Polling a cada 10s para acompanhar processamento
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadCustomerImport(file, workspaceId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["customer-imports", workspaceId],
      });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      toast({
        title: "Importação iniciada",
        description: `Arquivo "${data.fileName}" enviado com sucesso. ${data.totalRows} linhas serão processadas.`,
      });
      // Navegar para os detalhes da importação
      navigate(`/customer-imports/${data.importId}`);
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      const message =
        axiosError?.response?.data?.message ||
        "Ocorreu um erro ao enviar o arquivo. Tente novamente.";
      toast({
        title: "Erro no upload",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar formato
      if (
        !file.name.endsWith(".xlsx") &&
        file.type !==
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        toast({
          title: "Formato inválido",
          description:
            "Por favor, selecione um arquivo no formato .xlsx (Excel 2007+).",
          variant: "destructive",
        });
        return;
      }

      // Validar tamanho (10 MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10 MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const blob = await downloadImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template-importacao-customers.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Download iniciado",
        description: "O template de importação está sendo baixado.",
      });
    } catch {
      toast({
        title: "Erro ao baixar template",
        description: "Ocorreu um erro ao baixar o template. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const getProgressPercent = (item: CustomerImport) => {
    if (item.totalRows === 0) return 0;
    return Math.round(
      ((item.successCount + item.errorCount) / item.totalRows) * 100,
    );
  };

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Selecione um workspace para visualizar as importações
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Importação de Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Importe clientes em massa através de planilhas Excel (.xlsx)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
          >
            {isDownloadingTemplate ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Baixar Template
          </Button>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Importar Planilha
          </Button>
        </div>
      </div>

      {/* Lista de Importações */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md border border-red-200">
          <p className="text-red-800">
            Erro ao carregar importações. Tente novamente mais tarde.
          </p>
        </div>
      ) : importsData && importsData.items.length > 0 ? (
        <>
          <div className="space-y-4">
            {importsData.items.map((importItem) => {
              const progress = getProgressPercent(importItem);

              return (
                <Card
                  key={importItem.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/customer-imports/${importItem.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">
                          {importItem.fileName}
                        </CardTitle>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`${STATUS_COLORS[importItem.status]} flex items-center gap-1`}
                      >
                        {STATUS_ICONS[importItem.status]}
                        {STATUS_LABELS[importItem.status]}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm mt-2">
                      {importItem.totalRows} linha(s) •{" "}
                      {importItem.successCount} sucesso(s)
                      {importItem.errorCount > 0 && (
                        <span className="text-red-600">
                          {" "}
                          • {importItem.errorCount} erro(s)
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Progress bar para importações em andamento ou concluídas */}
                    {importItem.status === "PROCESSING" && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progresso</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Enviado em: {formatDate(importItem.createdAt)}</p>
                        {importItem.completedAt && (
                          <p>
                            Concluído em: {formatDate(importItem.completedAt)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customer-imports/${importItem.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" /> Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {importsData.totalPages > 1 && (
            <SmartPagination
              currentPage={currentPage}
              totalPages={importsData.totalPages}
              onPageChange={handlePageChange}
              showItemCount
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={importsData.total}
              itemLabel="importações"
            />
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma importação realizada
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Importe clientes em massa através de uma planilha Excel (.xlsx).
              <br />
              Baixe o template para garantir o formato correto.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" /> Baixar Template
              </Button>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" /> Importar Planilha
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Clientes</DialogTitle>
            <DialogDescription>
              Selecione um arquivo Excel (.xlsx) com os dados dos clientes.
              <br />O arquivo deve conter a coluna obrigatória{" "}
              <strong>Telefone</strong>, e opcionalmente <strong>Nome</strong> e{" "}
              <strong>Email</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Arquivo (.xlsx)</Label>
              <Input
                id="file"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
              />
            </div>

            {selectedFile && (
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {selectedFile.name}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <p>
                    <strong>Limites:</strong> Máximo de 10.000 linhas e 10 MB
                    por arquivo.
                  </p>
                  <p>
                    <strong>Formato do telefone:</strong> DDD + Número para
                    Brasil (ex: 11987654321) ou formato internacional com DDI
                    (ex: +16505551234). Números sem DDI são assumidos como
                    brasileiros.
                  </p>
                  <p>
                    <strong>Atualização:</strong> Clientes com o mesmo telefone
                    serão atualizados.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false);
                setSelectedFile(null);
              }}
              disabled={uploadMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {uploadMutation.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
