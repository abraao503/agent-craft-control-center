import { format } from "date-fns";
import { es, ptBR } from "date-fns/locale";
import { AlertCircle, Loader2 } from "lucide-react";
import { formatPhone } from "@/utils/phone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SmartPagination } from "@/components/common/SmartPagination";
import { DealWebhookStatusBadge } from "@/components/deal-webhooks/DealWebhookStatusBadge";
import type {
  DealWebhookExecution,
  DealWebhookExecutionStatus,
} from "@/types/deal-webhook";
import type { Pagination } from "@/types/pagination";
import { useAppLocale } from "@/i18n/LocaleProvider";

interface DealWebhookExecutionsProps {
  data?: Pagination<DealWebhookExecution>;
  isLoading: boolean;
  statusFilter?: DealWebhookExecutionStatus;
  page: number;
  limit: number;
  onStatusFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onOpenDetails: (execution: DealWebhookExecution) => void;
}

export function DealWebhookExecutions({
  data,
  isLoading,
  statusFilter,
  page,
  limit,
  onStatusFilterChange,
  onPageChange,
  onOpenDetails,
}: DealWebhookExecutionsProps) {
  const { locale } = useAppLocale();
  const dateLocale = locale === "es-ES" ? es : ptBR;
  const datePattern = locale === "es-ES" ? "dd/MM/yyyy 'a las' HH:mm" : "dd/MM/yyyy 'às' HH:mm";

  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Histórico de Execuções</CardTitle>
              <CardDescription>Últimas execuções deste webhook</CardDescription>
            </div>
            <Select
              value={statusFilter || "all"}
              onValueChange={onStatusFilterChange}
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data && data.items.length > 0 ? (
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
                    {data.items.map((execution) => (
                      <TableRow key={execution.id}>
                        <TableCell>
                          <DealWebhookStatusBadge status={execution.status} />
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
                          {format(execution.createdAt, datePattern, {
                            locale: dateLocale,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenDetails(execution)}
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

              {data.totalPages > 1 && (
                <div className="mt-4">
                  <SmartPagination
                    currentPage={page}
                    totalPages={data.totalPages}
                    onPageChange={onPageChange}
                    showItemCount
                    itemsPerPage={limit}
                    totalItems={data.total}
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
                  onClick={() => onStatusFilterChange("all")}
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
  );
}
