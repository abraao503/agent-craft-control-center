import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es, ptBR } from "date-fns/locale";
import {
  Building2,
  Edit2,
  Ellipsis,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { getCompanyById } from "@/services/company/getCompanyById";
import { listCompanyAdmins } from "@/services/company/listCompanyAdmins";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SmartPagination } from "@/components/common/SmartPagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdministrationBreadcrumb } from "./AdministrationBreadcrumb";
import { CreateCompanyUserDialog } from "./CreateCompanyUserDialog";
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";
import { EditWorkspaceDialog } from "./EditWorkspaceDialog";
import { DeleteWorkspaceDialog } from "./DeleteWorkspaceDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { User } from "@/types/user";
import { Workspace } from "@/types/workspace";
import { useTranslation } from "react-i18next";
import { useAppLocale } from "@/i18n/LocaleProvider";

const roleLabels: Record<string, string> = {
  PLATFORM_ADMIN: "Admin de plataforma",
  COMPANY_OWNER: "Dono da empresa",
  COMPANY_ADMIN: "Admin da empresa",
  WORKSPACE_OWNER: "Dono do workspace",
  WORKSPACE_ADMIN: "Admin do workspace",
  WORKSPACE_MANAGER: "Gerente",
  SALES_REP: "Vendedor",
};

function useDebouncedValue(value: string) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), 300);
    return () => window.clearTimeout(timeoutId);
  }, [value]);

  return debouncedValue;
}

interface AdminCompanyManagementProps {
  companyId: string;
  administrationPath?: string;
}

export function AdminCompanyManagement({
  companyId,
  administrationPath = "/company/settings",
}: AdminCompanyManagementProps) {
  const navigate = useNavigate();
  const { has, role } = usePermissions();
  const { t } = useTranslation();
  const { locale } = useAppLocale();
  const dateLocale = locale === "es-ES" ? es : ptBR;
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "team" ? "team" : "workspaces";
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const debouncedAdminSearch = useDebouncedValue(adminSearch);
  const [adminPage, setAdminPage] = useState(1);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editWorkspace, setEditWorkspace] = useState<Workspace | null>(null);
  const [deleteWorkspace, setDeleteWorkspace] = useState<Workspace | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const companyQuery = useQuery({
    queryKey: ["companyDetails", companyId],
    queryFn: () => getCompanyById(companyId),
    enabled: Boolean(companyId),
  });

  const adminsQuery = useQuery({
    queryKey: ["companyAdmins", companyId, adminPage, debouncedAdminSearch],
    queryFn: () =>
      listCompanyAdmins({
        companyId,
        page: adminPage,
        limit: 10,
        search: debouncedAdminSearch || undefined,
      }),
    enabled: Boolean(companyId && activeTab === "team"),
  });

  useEffect(() => setAdminPage(1), [debouncedAdminSearch]);

  const filteredWorkspaces = useMemo(() => {
    const normalizedSearch = workspaceSearch.trim().toLocaleLowerCase();

    return (
      companyQuery.data?.workspaces.filter((workspace) =>
        workspace.name.toLocaleLowerCase().includes(normalizedSearch),
      ) ?? []
    );
  }, [companyQuery.data, workspaceSearch]);

  const workspaceDetailsPath = (workspaceId: string) =>
    administrationPath === "/admin/companies"
      ? `/admin/companies/${companyId}/workspaces/${workspaceId}`
      : `/company/workspaces/${workspaceId}`;

  const canDeleteUser = (target: User) => {
    const hierarchy: Record<string, number> = {
      PLATFORM_ADMIN: 1,
      COMPANY_OWNER: 2,
      COMPANY_ADMIN: 3,
      WORKSPACE_OWNER: 4,
      WORKSPACE_ADMIN: 5,
      WORKSPACE_MANAGER: 6,
      SALES_REP: 7,
    };

    return Boolean(
      role && target.role && hierarchy[target.role] > hierarchy[role],
    );
  };

  if (companyQuery.isLoading) {
    return <AdminLoading />;
  }

  if (companyQuery.isError || !companyQuery.data) {
    return (
      <AdminEmpty
        title="Empresa não encontrada"
        description="Não foi possível carregar os dados desta empresa."
        action={() => navigate(administrationPath)}
        actionLabel="Voltar para Administração"
      />
    );
  }

  const company = companyQuery.data;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <AdministrationBreadcrumb
        items={[
          { label: "Administração", to: administrationPath },
          { label: company.name || "Empresa" },
        ]}
      />

      <AdminPageHeader
        icon={<Building2 className="h-6 w-6" />}
        title={company.name || "Empresa sem nome"}
        description={t("administration.createdAt", {
          date: format(new Date(company.createdAt), "dd/MM/yyyy", {
            locale: dateLocale,
          }),
        })}
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setSearchParams(value === "workspaces" ? {} : { tab: value })
        }
        className="space-y-5"
      >
        <AdminTabsList>
          <TabsTrigger value="workspaces" className={adminTabClassName}>
            Workspaces
            <CountBadge>{company.workspaces.length}</CountBadge>
          </TabsTrigger>
          <TabsTrigger value="team" className={adminTabClassName}>
            Equipe
            {adminsQuery.data && <CountBadge>{adminsQuery.data.total}</CountBadge>}
          </TabsTrigger>
        </AdminTabsList>

        <TabsContent value="workspaces" className="space-y-4">
          <SectionHeader
            title="Workspaces"
            description="Ambientes vinculados a esta empresa."
            action={
              has("create:workspace") ? (
                <Button onClick={() => setCreateWorkspaceOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo workspace
                </Button>
              ) : undefined
            }
          />
          <SearchInput
            value={workspaceSearch}
            onChange={setWorkspaceSearch}
            placeholder="Buscar workspace"
          />

          {filteredWorkspaces.length > 0 ? (
            <AdminList>
              {filteredWorkspaces.map((workspace) => {
                const dialogWorkspace = { ...workspace, companyId };
                const hasSecondaryActions =
                  has("update:workspace") ||
                  (has("delete:workspace") && !workspace.isDefault);

                return (
                  <AdminListRow
                    key={workspace.id}
                    onClick={() => navigate(workspaceDetailsPath(workspace.id))}
                    ariaLabel={`Abrir workspace ${workspace.name}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{workspace.name}</p>
                        {workspace.isDefault && (
                          <Badge variant="secondary">Padrão</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {workspace.isDefault
                          ? "Workspace principal da empresa"
                          : "Workspace da empresa"}
                      </p>
                    </div>

                    {hasSecondaryActions && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Mais ações para ${workspace.name}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Ellipsis className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {has("update:workspace") && (
                            <DropdownMenuItem
                              onClick={() => setEditWorkspace(dialogWorkspace)}
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {has("delete:workspace") && !workspace.isDefault && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteWorkspace(dialogWorkspace)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </AdminListRow>
                );
              })}
            </AdminList>
          ) : (
            <AdminEmpty
              title="Nenhum workspace encontrado"
              description={
                workspaceSearch
                  ? "Tente buscar por outro nome."
                  : "Esta empresa ainda não possui workspaces."
              }
              action={
                has("create:workspace")
                  ? () => setCreateWorkspaceOpen(true)
                  : undefined
              }
              actionLabel="Criar workspace"
            />
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <SectionHeader
            title="Equipe da empresa"
            description="Administradores com acesso ao contexto da empresa."
            action={
              has("create:company-user") ? (
                <Button onClick={() => setCreateUserOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo administrador
                </Button>
              ) : undefined
            }
          />
          <SearchInput
            value={adminSearch}
            onChange={setAdminSearch}
            placeholder="Buscar por nome ou email"
          />

          {adminsQuery.isLoading ? (
            <AdminLoading />
          ) : adminsQuery.data?.items.length ? (
            <>
              <AdminList>
                {adminsQuery.data.items.map((admin) => (
                  <AdminListRow key={admin.id}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{admin.name}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {admin.email}
                        <span className="hidden sm:inline">
                          {` · ${t("administration.since", {
                            date: format(new Date(admin.createdAt), "dd/MM/yyyy", {
                              locale: dateLocale,
                            }),
                          })}`}
                        </span>
                      </p>
                    </div>
                    <Badge variant="secondary">{roleLabels[admin.role]}</Badge>
                    {has("delete:company-user") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Mais ações para ${admin.name}`}
                          >
                            <Ellipsis className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={!canDeleteUser(admin)}
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteUser(admin)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </AdminListRow>
                ))}
              </AdminList>
              <SmartPagination
                currentPage={adminPage - 1}
                totalPages={adminsQuery.data.totalPages}
                onPageChange={(nextPage) => setAdminPage(nextPage + 1)}
              />
            </>
          ) : (
            <AdminEmpty
              title="Nenhum administrador encontrado"
              description={
                adminSearch
                  ? "Tente buscar por outro nome ou email."
                  : "A equipe administrativa está vazia."
              }
              action={
                has("create:company-user")
                  ? () => setCreateUserOpen(true)
                  : undefined
              }
              actionLabel="Adicionar administrador"
            />
          )}
        </TabsContent>
      </Tabs>

      <CreateWorkspaceDialog
        open={createWorkspaceOpen}
        onOpenChange={setCreateWorkspaceOpen}
        companyId={companyId}
      />
      <CreateCompanyUserDialog
        open={createUserOpen}
        onOpenChange={setCreateUserOpen}
        companyId={companyId}
      />
      <EditWorkspaceDialog
        open={Boolean(editWorkspace)}
        onOpenChange={(open) => !open && setEditWorkspace(null)}
        workspace={editWorkspace}
      />
      <DeleteWorkspaceDialog
        open={Boolean(deleteWorkspace)}
        onOpenChange={(open) => !open && setDeleteWorkspace(null)}
        workspace={deleteWorkspace}
      />
      <DeleteUserDialog
        open={Boolean(deleteUser)}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        user={deleteUser}
        companyId={companyId}
      />
    </div>
  );
}

export const adminTabClassName =
  "relative h-11 rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-2 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none";

export function AdminTabsList({ children }: { children: React.ReactNode }) {
  return (
    <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b bg-transparent p-0">
      {children}
    </TabsList>
  );
}

export function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

export function AdminPageHeader({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between md:p-6">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight md:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </header>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full sm:max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pl-9"
        placeholder={placeholder}
        type="search"
      />
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function AdminList({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
      {children}
    </div>
  );
}

export function AdminListRow({
  children,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }

    event.preventDefault();
    onClick();
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-muted/40 md:px-5 ${
        onClick ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" : ""
      }`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "link" : undefined}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

export function AdminLoading() {
  return (
    <div className="flex justify-center rounded-xl border border-dashed py-16">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
    </div>
  );
}

export function AdminEmpty({
  title,
  description,
  action,
  actionLabel,
}: {
  title: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-card/50 p-10 text-center">
      <Users className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <Button className="mt-4" onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
