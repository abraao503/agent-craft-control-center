import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listUsers } from "@/services/user/listUsers";
import { getCompanyById } from "@/services/company/getCompanyById";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/auth/hooks";
import { CreateCompanyUserDialog } from "@/components/admin/CreateCompanyUserDialog";
import { EditWorkspaceUserDialog } from "@/components/admin/EditWorkspaceUserDialog";
import { DeleteUserDialog } from "@/components/admin/DeleteUserDialog";
import { User } from "@/types/user";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Plus,
  Briefcase,
  Users,
  ArrowLeft,
  Building2,
  Edit2,
  Trash2,
} from "lucide-react";
import { UserRole } from "@/services/company/listCompanyAdmins";

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.PLATFORM_ADMIN]: "Admin de Plataforma",
  [UserRole.COMPANY_OWNER]: "Dono da Empresa",
  [UserRole.COMPANY_ADMIN]: "Admin da Empresa",
  [UserRole.WORKSPACE_OWNER]: "Dono do Workspace",
  [UserRole.WORKSPACE_ADMIN]: "Admin do Workspace",
  [UserRole.WORKSPACE_MANAGER]: "Gerente do Workspace",
  [UserRole.SALES_REP]: "Vendedor",
};

const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.PLATFORM_ADMIN]: "bg-purple-100 text-purple-800",
  [UserRole.COMPANY_OWNER]: "bg-blue-100 text-blue-800",
  [UserRole.COMPANY_ADMIN]: "bg-indigo-100 text-indigo-800",
  [UserRole.WORKSPACE_OWNER]: "bg-green-100 text-green-800",
  [UserRole.WORKSPACE_ADMIN]: "bg-emerald-100 text-emerald-800",
  [UserRole.WORKSPACE_MANAGER]: "bg-cyan-100 text-cyan-800",
  [UserRole.SALES_REP]: "bg-gray-100 text-gray-800",
};

export default function CompanyWorkspaceDetailsPage() {
  const { workspaceId } = useParams<{
    workspaceId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { has } = usePermissions();
  const { user } = useAuth();
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPage, setUserPage] = useState(1);
  const userLimit = 10;

  // Pega o companyId do usuário logado
  const companyId = user?.companyId;

  // Get workspace data from navigation state (already loaded from company page)
  const workspaceFromState = location.state?.workspace as
    | { id: string; name: string; isDefault: boolean }
    | undefined;

  const { data: company } = useQuery({
    queryKey: ["companyDetails", companyId],
    queryFn: () => getCompanyById(companyId!),
    enabled: !!companyId,
  });

  // Use listUsers service with workspaceId parameter
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["workspaceUsers", workspaceId, userPage],
    queryFn: () =>
      listUsers({
        workspaceId: workspaceId!,
        page: userPage,
        limit: userLimit,
      }),
    enabled: !!workspaceId,
  });

  // Find workspace in company data if not in state
  const workspace =
    workspaceFromState || company?.workspaces.find((w) => w.id === workspaceId);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditUserOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteUserOpen(true);
  };

  // Role hierarchy to check if user can delete
  const ROLE_HIERARCHY: Record<string, number> = {
    PLATFORM_ADMIN: 1,
    COMPANY_OWNER: 2,
    COMPANY_ADMIN: 3,
    WORKSPACE_OWNER: 4,
    WORKSPACE_ADMIN: 5,
    WORKSPACE_MANAGER: 6,
    SALES_REP: 7,
  };

  const canDeleteUser = (targetUser: User): boolean => {
    const currentUserRole = has("manage:company")
      ? "COMPANY_OWNER"
      : has("create:workspace")
      ? "COMPANY_ADMIN"
      : "WORKSPACE_ADMIN";

    if (!targetUser.role) return false;

    const currentLevel = ROLE_HIERARCHY[currentUserRole];
    const targetLevel = ROLE_HIERARCHY[targetUser.role];

    // Can only delete users with lower privilege (higher level number)
    return targetLevel > currentLevel;
  };

  // Verifica se o usuário tem permissão de nível empresa
  if (!has("manage:company") && !has("create:workspace")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
          <p className="text-gray-600">
            Você não tem permissão para acessar este recurso.
          </p>
        </div>
      </div>
    );
  }

  if (!workspace && !company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Workspace não encontrado</h2>
          <Button onClick={() => navigate(`/company/settings`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para empresa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/company/settings`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <button
                onClick={() => navigate(`/company/settings`)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {company?.name || "Empresa"}
              </button>
              <span className="text-muted-foreground">/</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">{workspace.name}</h1>
              {workspace.isDefault && <Badge variant="secondary">Padrão</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Users Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuários do Workspace
              </CardTitle>
              <CardDescription>
                Gerenciar usuários com acesso a este workspace
              </CardDescription>
            </div>
            {has("create:workspace-user") && (
              <Button onClick={() => setCreateUserOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Usuário
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : usersData && usersData.users.length > 0 ? (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          {user.role && (
                            <Badge
                              className={ROLE_COLORS[user.role as UserRole]}
                              variant="secondary"
                            >
                              {ROLE_LABELS[user.role as UserRole]}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          -
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                              title="Editar usuário"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user)}
                              title="Deletar usuário"
                              disabled={!canDeleteUser(user)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {usersData && Math.ceil(usersData.total / userLimit) > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(userPage - 1) * userLimit + 1} a{" "}
                    {Math.min(userPage * userLimit, usersData.total)} de{" "}
                    {usersData.total} usuários
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserPage(userPage - 1)}
                      disabled={userPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserPage(userPage + 1)}
                      disabled={
                        userPage >= Math.ceil(usersData.total / userLimit)
                      }
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nenhum usuário cadastrado neste workspace
              </p>
              {has("create:workspace-user") && (
                <Button
                  onClick={() => setCreateUserOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Usuário
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {has("create:workspace-user") && (
        <>
          <CreateCompanyUserDialog
            open={createUserOpen}
            onOpenChange={setCreateUserOpen}
            companyId={companyId!}
            workspaceId={workspaceId!}
          />

          <EditWorkspaceUserDialog
            open={editUserOpen}
            onOpenChange={setEditUserOpen}
            user={selectedUser}
            workspaceId={workspaceId!}
          />

          <DeleteUserDialog
            open={deleteUserOpen}
            onOpenChange={setDeleteUserOpen}
            user={selectedUser}
            workspaceId={workspaceId}
            companyId={companyId}
          />
        </>
      )}
    </div>
  );
}
