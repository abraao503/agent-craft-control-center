import { useAuth } from "@/contexts/auth/hooks";
import { AdminWorkspaceManagement } from "@/components/admin/AdminWorkspaceManagement";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";

export default function WorkspaceSettingsPage() {
  const { user, userProfile } = useAuth();
  const { currentWorkspace } = useWorkspaceContext();
  if (!user?.companyId || !userProfile?.workspaceId) return null;
  const workspaceName =
    currentWorkspace?.id === userProfile.workspaceId
      ? currentWorkspace.name
      : "Meu workspace";

  return (
    <AdminWorkspaceManagement
      companyId={user.companyId}
      workspaceId={userProfile.workspaceId}
      workspaceName={workspaceName}
      workspaceType={currentWorkspace?.type}
      isDefault={currentWorkspace?.isDefault}
      breadcrumbItems={[
        { label: "Administração", to: "/workspace/settings" },
        { label: workspaceName },
      ]}
    />
  );
}
