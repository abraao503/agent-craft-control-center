import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCompanyById } from "@/services/company/getCompanyById";
import { AdminLoading } from "@/components/admin/AdminCompanyManagement";
import { AdminWorkspaceManagement } from "@/components/admin/AdminWorkspaceManagement";

export default function WorkspaceDetailsPage() {
  const { companyId, workspaceId } = useParams<{ companyId: string; workspaceId: string }>();
  const company = useQuery({ queryKey: ["companyDetails", companyId], queryFn: () => getCompanyById(companyId!), enabled: Boolean(companyId) });
  if (!companyId || !workspaceId) return null;
  if (company.isLoading) return <AdminLoading />;
  const workspace = company.data?.workspaces.find((item) => item.id === workspaceId);
  return workspace ? (
    <AdminWorkspaceManagement
      companyId={companyId}
      workspaceId={workspaceId}
      workspaceName={workspace.name}
      companyName={company.data?.name}
      isDefault={workspace.isDefault}
      breadcrumbItems={[
        { label: "Administração", to: "/admin/companies" },
        {
          label: company.data?.name || "Empresa",
          to: `/admin/companies/${companyId}`,
        },
        { label: workspace.name },
      ]}
    />
  ) : null;
}
