import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth/hooks";
import { useQuery } from "@tanstack/react-query";
import { getCompanyById } from "@/services/company/getCompanyById";
import { AdminLoading } from "@/components/admin/AdminCompanyManagement";
import { AdminWorkspaceManagement } from "@/components/admin/AdminWorkspaceManagement";

export default function CompanyWorkspaceDetailsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useAuth();
  const company = useQuery({ queryKey: ["companyDetails", user?.companyId], queryFn: () => getCompanyById(user!.companyId), enabled: Boolean(user?.companyId) });
  if (!user?.companyId || !workspaceId) return null;
  if (company.isLoading) return <AdminLoading />;
  const workspace = company.data?.workspaces.find((item) => item.id === workspaceId);
  return workspace ? (
    <AdminWorkspaceManagement
      companyId={user.companyId}
      workspaceId={workspaceId}
      workspaceName={workspace.name}
      workspaceType={workspace.type}
      companyName={company.data?.name}
      isDefault={workspace.isDefault}
      breadcrumbItems={[
        { label: "Administração", to: "/company/settings" },
        { label: workspace.name },
      ]}
    />
  ) : null;
}
