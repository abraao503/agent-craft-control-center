import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { enUS, es, ptBR } from "date-fns/locale";
import { Briefcase, Edit2, Ellipsis, LogIn, Plus, Trash2 } from "lucide-react";
import { listUsers } from "@/services/user/listUsers";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SmartPagination } from "@/components/common/SmartPagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AdministrationBreadcrumb,
  AdministrationBreadcrumbItem,
} from "./AdministrationBreadcrumb";
import { CreateCompanyUserDialog } from "./CreateCompanyUserDialog";
import { EditWorkspaceUserDialog } from "./EditWorkspaceUserDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { ImpersonateUserDialog } from "./ImpersonateUserDialog";
import { DealDistributionSection } from "./DealDistributionSection";
import {
  AdminEmpty,
  AdminList,
  AdminListRow,
  AdminLoading,
  AdminPageHeader,
  AdminTabsList,
  CountBadge,
  SearchInput,
  SectionHeader,
  adminTabClassName,
} from "./AdminCompanyManagement";
import { User } from "@/types/user";
import { useTranslation } from "react-i18next";
import { useAppLocale } from "@/i18n/LocaleProvider";
import { useAuth } from "@/contexts/auth/hooks";

const roleLabels: Record<string, string> = {
  WORKSPACE_OWNER: "Dono do workspace",
  WORKSPACE_ADMIN: "Admin do workspace",
  WORKSPACE_MANAGER: "Gerente",
  SALES_REP: "Vendedor",
};

const distributionRoles = new Set([
  "PLATFORM_ADMIN",
  "COMPANY_OWNER",
  "COMPANY_ADMIN",
  "WORKSPACE_OWNER",
  "WORKSPACE_ADMIN",
  "WORKSPACE_MANAGER",
]);

interface AdminWorkspaceManagementProps {
  companyId: string;
  workspaceId: string;
  workspaceName: string;
  workspaceType?: "COMMERCIAL" | "OPERATION";
  companyName?: string | null;
  isDefault?: boolean;
  breadcrumbItems: AdministrationBreadcrumbItem[];
}

export function AdminWorkspaceManagement({
  companyId,
  workspaceId,
  workspaceName,
  workspaceType = "COMMERCIAL",
  companyName,
  isDefault = false,
  breadcrumbItems,
}: AdminWorkspaceManagementProps) {
  const { has, role } = usePermissions();
  const { userProfile } = useAuth();
  const { t } = useTranslation();
  const { locale } = useAppLocale();
  const dateLocale = locale === "es-ES" ? es : locale === "en-US" ? enUS : ptBR;
  const canManageDistribution =
    workspaceType !== "OPERATION" &&
    (has("manage:deal-distribution") ||
      Boolean(role && distributionRoles.has(role)));
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab =
    searchParams.get("tab") === "distribution" &&
    canManageDistribution
      ? "distribution"
      : "team";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [impersonateUser, setImpersonateUser] = useState<User | null>(null);
  const canImpersonate = has("impersonate:user") && !userProfile?.impersonation;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => setPage(1), [debouncedSearch]);

  const usersQuery = useQuery({
    queryKey: [
      "workspaceUsers",
      companyId,
      workspaceId,
      page,
      debouncedSearch,
    ],
    queryFn: () =>
      listUsers({
        companyId,
        workspaceId,
        page,
        limit: 10,
        search: debouncedSearch || undefined,
      }),
    enabled: Boolean(workspaceId && activeTab === "team"),
  });

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

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <AdministrationBreadcrumb items={breadcrumbItems} />

      <AdminPageHeader
        icon={<Briefcase className="h-6 w-6" />}
        title={workspaceName}
        description={
          companyName
            ? t("administration.workspaceCompany", { name: companyName })
            : t("administration.workspaceAdministration")
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {workspaceType === "OPERATION" ? "Operação" : "Comercial"}
            </Badge>
            {isDefault && <Badge variant="secondary">Padrão</Badge>}
          </div>
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setSearchParams(value === "team" ? {} : { tab: value })
        }
        className="space-y-5"
      >
        <AdminTabsList>
          <TabsTrigger value="team" className={adminTabClassName}>
            Equipe
            {usersQuery.data && <CountBadge>{usersQuery.data.total}</CountBadge>}
          </TabsTrigger>
          {canManageDistribution && (
            <TabsTrigger value="distribution" className={adminTabClassName}>
              Distribuição
            </TabsTrigger>
          )}
        </AdminTabsList>

        <TabsContent value="team" className="space-y-4">
          <SectionHeader
            title="Equipe do workspace"
            description="Pessoas com acesso a este ambiente."
            action={
              has("create:workspace-user") ? (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo usuário
                </Button>
              ) : undefined
            }
          />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nome ou email"
          />

          {usersQuery.isLoading ? (
            <AdminLoading />
          ) : usersQuery.isError ? (
            <AdminEmpty
              title="Não foi possível carregar a equipe"
              description="Tente novamente em alguns instantes."
              action={() => usersQuery.refetch()}
              actionLabel="Tentar novamente"
            />
          ) : usersQuery.data?.items.length ? (
            <>
              <AdminList>
                {usersQuery.data.items.map((user) => (
                  <AdminListRow key={user.id}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{user.name}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {user.email}
                        {user.createdAt && (
                          <span className="hidden sm:inline">
                            {` · ${t("administration.since", {
                              date: format(new Date(user.createdAt), "dd/MM/yyyy", {
                                locale: dateLocale,
                              }),
                            })}`}
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {roleLabels[user.role || ""] || user.role}
                    </Badge>
                    {has("create:workspace-user") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Mais ações para ${user.name}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Ellipsis className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canImpersonate && (
                            <DropdownMenuItem
                              onClick={() => setImpersonateUser(user)}
                            >
                              <LogIn className="mr-2 h-4 w-4" />
                              Acessar como usuário
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setEditUser(user)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!canDeleteUser(user)}
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteUser(user)}
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
                currentPage={page - 1}
                totalPages={usersQuery.data.totalPages}
                onPageChange={(nextPage) => setPage(nextPage + 1)}
              />
            </>
          ) : (
            <AdminEmpty
              title="Nenhuma pessoa com acesso direto a este workspace"
              description={
                search
                  ? "Tente buscar por outro nome ou email."
                  : "Adicione uma pessoa ao workspace para que ela apareça aqui."
              }
              action={
                has("create:workspace-user")
                  ? () => setCreateOpen(true)
                  : undefined
              }
              actionLabel="Adicionar usuário"
            />
          )}
        </TabsContent>

        <TabsContent value="distribution">
          <DealDistributionSection workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>

      <CreateCompanyUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyId={companyId}
        workspaceId={workspaceId}
      />
      <EditWorkspaceUserDialog
        open={Boolean(editUser)}
        onOpenChange={(open) => !open && setEditUser(null)}
        user={editUser}
        workspaceId={workspaceId}
      />
      <DeleteUserDialog
        open={Boolean(deleteUser)}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        user={deleteUser}
        workspaceId={workspaceId}
        companyId={companyId}
      />
      <ImpersonateUserDialog
        open={Boolean(impersonateUser)}
        onOpenChange={(open) => !open && setImpersonateUser(null)}
        user={impersonateUser}
      />
    </div>
  );
}
