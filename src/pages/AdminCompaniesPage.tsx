import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { enUS, es, ptBR } from "date-fns/locale";
import { Building2, Edit2, Ellipsis, Plus } from "lucide-react";
import { listCompanies } from "@/services/company/listCompanies";
import { usePermissions } from "@/hooks/usePermissions";
import { CreateCompanyDialog } from "@/components/admin/CreateCompanyDialog";
import { EditCompanyDialog } from "@/components/admin/EditCompanyDialog";
import { AdministrationBreadcrumb } from "@/components/admin/AdministrationBreadcrumb";
import {
  AdminEmpty,
  AdminList,
  AdminListRow,
  AdminLoading,
  AdminPageHeader,
  SearchInput,
  SectionHeader,
} from "@/components/admin/AdminCompanyManagement";
import { Company } from "@/types/company";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { setMetaCloudAccess } from "@/services/company/setMetaCloudAccess";
import { SmartPagination } from "@/components/common/SmartPagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { useAppLocale } from "@/i18n/LocaleProvider";

export default function AdminCompaniesPage() {
  const navigate = useNavigate();
  const { has } = usePermissions();
  const { t } = useTranslation();
  const { locale } = useAppLocale();
  const dateLocale = locale === "es-ES" ? es : locale === "en-US" ? enUS : ptBR;
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const limit = 10;
  const metaCloudMutation = useMutation({
    mutationFn: ({ companyId, enabled }: { companyId: string; enabled: boolean }) =>
      setMetaCloudAccess(companyId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });

  const companiesQuery = useQuery({
    queryKey: ["companies", currentPage, debouncedSearch],
    queryFn: () =>
      listCompanies({
        limit,
        page: currentPage,
        search: debouncedSearch || undefined,
      }),
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => setCurrentPage(1), [debouncedSearch]);

  if (!has("view:all-companies")) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <AdminEmpty
          title="Acesso negado"
          description="Você não tem permissão para acessar a administração da plataforma."
        />
      </div>
    );
  }

  const openCompany = (companyId: string) => {
    navigate(`/admin/companies/${companyId}`);
  };

  const editCompany = (company: Company) => {
    setSelectedCompany(company);
    setEditOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <AdministrationBreadcrumb items={[{ label: "Administração" }]} />

      <AdminPageHeader
        icon={<Building2 className="h-6 w-6" />}
        title="Administração"
        description="Gerencie as empresas e acesse seus workspaces."
        action={
          has("create:company") ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova empresa
            </Button>
          ) : undefined
        }
      />

      <section className="space-y-4">
        <SectionHeader
          title="Empresas"
          description={
            companiesQuery.data
              ? `${companiesQuery.data.total} ${
                  companiesQuery.data.total === 1
                    ? "empresa cadastrada"
                    : "empresas cadastradas"
                }`
              : "Empresas cadastradas na plataforma."
          }
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por empresa, dono ou email"
        />

        {companiesQuery.isError && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            Não foi possível carregar as empresas. Tente novamente.
          </div>
        )}

        {companiesQuery.isLoading ? (
          <AdminLoading />
        ) : companiesQuery.data?.items.length ? (
          <>
            <AdminList>
              {companiesQuery.data.items.map((company) => (
                <AdminListRow
                  key={company.id}
                  onClick={() => openCompany(company.id)}
                  ariaLabel={`Abrir empresa ${company.name}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{company.name}</p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {company.ownerName || "Sem proprietário informado"}
                      {company.ownerEmail && ` · ${company.ownerEmail}`}
                    </p>
                  </div>
                  <p className="hidden text-sm text-muted-foreground lg:block">
                    {t("administration.createdAt", {
                      date: format(new Date(company.createdAt), "dd/MM/yyyy", {
                        locale: dateLocale,
                      }),
                    })}
                  </p>
                  {has("manage:platform") && (
                    <div
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <span>Cloud piloto</span>
                      <Switch
                        checked={company.metaCloudWhatsappEnabled}
                        disabled={metaCloudMutation.isPending}
                        onCheckedChange={(enabled) =>
                          metaCloudMutation.mutate({ companyId: company.id, enabled })
                        }
                        aria-label={`Habilitar WhatsApp Cloud para ${company.name}`}
                      />
                    </div>
                  )}
                  {has("manage:company") && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Mais ações para ${company.name}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => editCompany(company)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </AdminListRow>
              ))}
            </AdminList>

            <SmartPagination
              currentPage={currentPage - 1}
              totalPages={companiesQuery.data.totalPages}
              onPageChange={(nextPage) => setCurrentPage(nextPage + 1)}
              showItemCount
              itemsPerPage={limit}
              totalItems={companiesQuery.data.total}
              itemLabel="empresas"
            />
          </>
        ) : (
          <AdminEmpty
            title="Nenhuma empresa encontrada"
            description={
              search
                ? "Tente buscar por outro nome, proprietário ou email."
                : "Cadastre a primeira empresa para começar."
            }
            action={
              has("create:company") ? () => setCreateOpen(true) : undefined
            }
            actionLabel="Criar empresa"
          />
        )}
      </section>

      <CreateCompanyDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditCompanyDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        company={selectedCompany}
      />
    </div>
  );
}
