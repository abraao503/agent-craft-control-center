import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCompanyById } from "@/services/company/getCompanyById";
import { listCompanyAdmins } from "@/services/company/listCompanyAdmins";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/auth/hooks";
import { CreateCompanyUserDialog } from "@/components/admin/CreateCompanyUserDialog";
import { DeleteUserDialog } from "@/components/admin/DeleteUserDialog";
import { EditWorkspaceDialog } from "@/components/admin/EditWorkspaceDialog";
import { DeleteWorkspaceDialog } from "@/components/admin/DeleteWorkspaceDialog";
import { CreateWorkspaceDialog } from "@/components/admin/CreateWorkspaceDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Building2,
  Users,
  Briefcase,
  Calendar,
  ExternalLink,
  Trash2,
  Edit2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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

export default function CompanySettingsPage() {
  const navigate = useNavigate();
  const { has } = usePermissions();
  const { user } = useAuth();
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null>(null);
  const [editWorkspaceOpen, setEditWorkspaceOpen] = useState(false);
  const [deleteWorkspaceOpen, setDeleteWorkspaceOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<{
    id: string;
    name: string;
    isDefault: boolean;
    companyId: string;
  } | null>(null);
  const [adminPage, setAdminPage] = useState(1);
  const adminLimit = 10;

  // Pega o companyId do usuário logado
  const companyId = user?.companyId;

  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ["companyDetails", companyId],
    queryFn: () => getCompanyById(companyId!),
    enabled: !!companyId,
  });

  const { data: admins, isLoading: loadingAdmins } = useQuery({
    queryKey: ["companyAdmins", companyId, adminPage],
    queryFn: () =>
      listCompanyAdmins({
        companyId: companyId!,
        page: adminPage,
        limit: adminLimit,
      }),
    enabled: !!companyId,
  });

  const handleDelete = (user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  }) => {
    setSelectedUser(user);
    setDeleteUserOpen(true);
  };

  const handleEditWorkspace = (workspace: {
    id: string;
    name: string;
    isDefault: boolean;
  }) => {
    setSelectedWorkspace({ ...workspace, companyId: companyId! });
    setEditWorkspaceOpen(true);
  };

  const handleDeleteWorkspace = (workspace: {
    id: string;
    name: string;
    isDefault: boolean;
  }) => {
    setSelectedWorkspace({ ...workspace, companyId: companyId! });
    setDeleteWorkspaceOpen(true);
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

  const canDeleteUser = (targetUser: { role: UserRole }): boolean => {
    const currentUserRole = has("manage:company")
      ? "COMPANY_OWNER"
      : has("create:workspace")
      ? "COMPANY_ADMIN"
      : "WORKSPACE_ADMIN";

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

  if (loadingCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Empresa não encontrada</h2>
          <p className="text-muted-foreground">
            Não foi possível carregar os dados da sua empresa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">{company.name}</h1>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              Criada em{" "}
              {format(new Date(company.createdAt), "dd/MM/yyyy", {
                locale: ptBR,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="workspaces" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="workspaces" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Workspaces ({company.workspaces.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários ({admins?.total || 0})
          </TabsTrigger>
        </TabsList>

        {/* Aba Workspaces */}
        <TabsContent value="workspaces" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Workspaces da Empresa</CardTitle>
                  <CardDescription>
                    Lista de todos os workspaces disponíveis nesta empresa
                  </CardDescription>
                </div>
                {has("create:workspace") && (
                  <Button
                    onClick={() => setCreateWorkspaceOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Novo Workspace
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {company.workspaces.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Nenhum workspace encontrado
                  </p>
                  {has("create:workspace") && (
                    <Button
                      onClick={() => setCreateWorkspaceOpen(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Criar Primeiro Workspace
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {company.workspaces.map((workspace) => (
                        <TableRow
                          key={workspace.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            navigate(`/company/workspaces/${workspace.id}`, {
                              state: { workspace },
                            })
                          }
                        >
                          <TableCell className="font-medium">
                            {workspace.name}
                          </TableCell>
                          <TableCell>
                            {workspace.isDefault ? (
                              <Badge variant="secondary">Padrão</Badge>
                            ) : (
                              <Badge variant="outline">Workspace</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {has("update:workspace") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditWorkspace(workspace);
                                  }}
                                  title="Editar workspace"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              )}
                              {has("delete:workspace") &&
                                !workspace.isDefault && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteWorkspace(workspace);
                                    }}
                                    title="Apagar workspace"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/company/workspaces/${workspace.id}`,
                                    {
                                      state: { workspace },
                                    }
                                  );
                                }}
                                title="Ver detalhes e usuários do workspace"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Usuários */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Administradores da Empresa</CardTitle>
                  <CardDescription>
                    Usuários de nível empresa (sem workspace específico)
                  </CardDescription>
                </div>
                {has("create:company-user") && (
                  <Button
                    onClick={() => setCreateUserOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Novo Usuário
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingAdmins ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : admins && admins.items.length > 0 ? (
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
                        {admins.items.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.name}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {user.email}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={ROLE_COLORS[user.role]}
                                variant="secondary"
                              >
                                {ROLE_LABELS[user.role]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(user.createdAt), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </TableCell>
                            <TableCell className="text-right">
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
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {admins.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Mostrando {(adminPage - 1) * adminLimit + 1} a{" "}
                        {Math.min(adminPage * adminLimit, admins.total)} de{" "}
                        {admins.total} usuários
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdminPage(adminPage - 1)}
                          disabled={adminPage === 1}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdminPage(adminPage + 1)}
                          disabled={adminPage === admins.totalPages}
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
                    Nenhum usuário cadastrado
                  </p>
                  {has("create:company-user") && (
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
        </TabsContent>
      </Tabs>

      {has("create:company-user") && (
        <CreateCompanyUserDialog
          open={createUserOpen}
          onOpenChange={setCreateUserOpen}
          companyId={companyId!}
        />
      )}

      {has("create:workspace") && (
        <CreateWorkspaceDialog
          open={createWorkspaceOpen}
          onOpenChange={setCreateWorkspaceOpen}
          companyId={companyId}
        />
      )}

      <DeleteUserDialog
        open={deleteUserOpen}
        onOpenChange={setDeleteUserOpen}
        user={selectedUser}
        companyId={companyId}
      />

      {selectedWorkspace && (
        <>
          <EditWorkspaceDialog
            open={editWorkspaceOpen}
            onOpenChange={setEditWorkspaceOpen}
            workspace={selectedWorkspace}
          />

          <DeleteWorkspaceDialog
            open={deleteWorkspaceOpen}
            onOpenChange={setDeleteWorkspaceOpen}
            workspace={selectedWorkspace}
          />
        </>
      )}
    </div>
  );
}
