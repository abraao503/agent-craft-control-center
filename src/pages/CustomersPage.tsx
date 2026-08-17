import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Users,
  ChevronUp,
  ChevronDown,
  Download,
  FileUp,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Customer, CustomerListParams } from "@/types/customer";
import { listCustomers } from "@/services/customer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { formatPhone } from "@/utils/phone";
import { useTranslation } from "react-i18next";
import { useAppLocale } from "@/i18n/LocaleProvider";

const CustomersPage = () => {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [queryParams, setQueryParams] = useState<CustomerListParams>({
    page: 1,
    limit: 10,
    orderBy: "createdAt",
    order: "desc",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { locale } = useAppLocale();

  const { workspaceId, isChangingWorkspace } = useWorkspaceManager({
    queryKeys: ["listCustomers"],
    autoRefetch: true,
    trackLoadingState: true,
  });

  // Debounce busca com 500ms de delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(localSearchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  // Atualiza params de query quando a busca debounceada muda
  useEffect(() => {
    setQueryParams((prev) => ({
      ...prev,
      search: debouncedSearch || undefined,
      page: 1,
    }));
  }, [debouncedSearch]);

  const { isLoading, data, error, refetch } = useQuery({
    queryKey: ["listCustomers", queryParams, workspaceId],
    queryFn: () => listCustomers(queryParams, workspaceId || ""),
  });

  useEffect(() => {
    if (error) {
      toast({
        title: t("common.error"),
        description: t("common.unknownError"),
        variant: "destructive",
      });
    }
  }, [error, t, toast]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setLocalSearchQuery(query);
  };

  const handleSort = (field: string) => {
    setQueryParams((prev) => ({
      ...prev,
      orderBy: field,
      order: prev.orderBy === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({
      ...prev,
      page,
    }));
  };

  const getSortIcon = (field: string) => {
    if (queryParams.orderBy !== field) return null;
    return queryParams.order === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleRowClick = (customer: Customer) => {
    navigate(`/customers/${customer.id}`);
  };

  return (
    <div>
      <div className="container mx-auto py-6 px-6 w-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("customers.title")}</h1>
            <p className="text-muted-foreground">
              {t("customers.description")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/customer-imports")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileUp className="h-4 w-4" />
              {t("customers.import")}
            </Button>
            <Button
              onClick={() => navigate("/customers/export-xlsx")}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t("customers.export")}
            </Button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10"
              placeholder={t("customers.searchPlaceholder")}
            value={localSearchQuery}
            onChange={handleSearch}
          />
        </div>

        {isLoading || isChangingWorkspace ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="h-12 bg-muted rounded animate-pulse"
              />
            ))}
          </div>
        ) : (data?.items.length ?? 0) === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            {localSearchQuery ? (
              <>
                <h3 className="font-medium text-lg">{t("customers.noMatches")}</h3>
                <p className="text-muted-foreground">{t("customers.noMatchesDescription")}</p>
              </>
            ) : (
              <>
                <h3 className="font-medium text-lg">{t("customers.empty")}</h3>
                <p className="text-muted-foreground mb-4">{t("customers.emptyDescription")}</p>
                <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              </>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("customers.name")}</TableHead>
                    <TableHead>{t("customers.phone")}</TableHead>
                    <TableHead>
                      <div
                        className="flex items-center cursor-pointer"
                        onClick={() => handleSort("createdAt")}
                      >
                        <span>{t("customers.createdAt")}</span>
                        {getSortIcon("createdAt")}
                      </div>
                    </TableHead>
                    <TableHead>
                      <div
                        className="flex items-center cursor-pointer"
                        onClick={() => handleSort("updatedAt")}
                      >
                        <span>{t("customers.updatedAt")}</span>
                        {getSortIcon("updatedAt")}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(customer)}
                    >
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{formatPhone(customer.phone)}</TableCell>
                      <TableCell>{formatDate(customer.createdAt)}</TableCell>
                      <TableCell>{formatDate(customer.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {data && data.totalPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        handlePageChange(Math.max(1, queryParams.page! - 1))
                      }
                      className={
                        queryParams.page === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {[...Array(data.totalPages)].map((_, i) => {
                    const page = i + 1;

                    // Mostrar apenas primeira, última, atual e páginas adjacentes
                    if (
                      page === 1 ||
                      page === data.totalPages ||
                      page === queryParams.page ||
                      page === queryParams.page! - 1 ||
                      page === queryParams.page! + 1
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={page === queryParams.page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }

                    // Add ellipsis if needed
                    if (
                      page === queryParams.page! - 2 ||
                      page === queryParams.page! + 2
                    ) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        handlePageChange(
                          Math.min(data.totalPages, queryParams.page! + 1),
                        )
                      }
                      className={
                        queryParams.page === data.totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
