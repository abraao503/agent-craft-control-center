import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listCompanies } from "@/services/company/listCompanies";
import { usePermissions } from "@/hooks/usePermissions";
import { CreateCompanyDialog } from "@/components/admin/CreateCompanyDialog";
import { EditCompanyDialog } from "@/components/admin/EditCompanyDialog";
import { Company } from "@/types/company";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SmartPagination } from "@/components/common/SmartPagination";
import { Plus, Edit2, Loader2, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminCompaniesPage() {
  const navigate = useNavigate();
  const { has } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ["companies", currentPage],
    queryFn: () =>
      listCompanies({
        limit,
        offset: currentPage * limit,
      }),
  });

  if (!has("view:all-companies")) {
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

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setEditOpen(true);
  };

  const handleViewDetails = (companyId: string) => {
    navigate(`/admin/companies/${companyId}`);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Empresas</h1>
          <p className="text-gray-600 mt-1">
            Administre todas as empresas da plataforma
          </p>
        </div>

        {has("create:company") && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Empresa
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Erro ao carregar empresas. Tente novamente.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data && data.companies.length > 0 ? (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Empresa</TableHead>
                  <TableHead>Dono</TableHead>
                  <TableHead>Email do Dono</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">
                      {company.name}
                    </TableCell>
                    <TableCell>{company.ownerName}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {company.ownerEmail}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {format(
                        new Date(company.createdAt),
                        "dd/MM/yyyy 'às' HH:mm",
                        {
                          locale: ptBR,
                        }
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(company.id)}
                          title="Ver detalhes, workspaces e usuários"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {has("manage:company") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(company)}
                            title="Editar empresa"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <SmartPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showItemCount
            itemsPerPage={limit}
            totalItems={data.total}
            itemLabel="empresas"
          />
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Nenhuma empresa cadastrada</p>
          {has("create:company") && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Empresa
            </Button>
          )}
        </div>
      )}

      <CreateCompanyDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditCompanyDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        company={selectedCompany}
      />
    </div>
  );
}
