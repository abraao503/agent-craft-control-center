import { Permission, UserRole } from "@/types/auth";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isCompanyLevelRole,
  isWorkspaceLevelRole,
} from "@/utils/permissions";
import { useAuth } from "@/contexts/auth/hooks";

export function usePermissions() {
  const { userProfile } = useAuth();

  const permissions = userProfile?.permissions ?? [];
  const role = userProfile?.role;

  return {
    has: (permission: Permission): boolean =>
      hasPermission(permissions, permission),

    hasAny: (permissions: Permission[]): boolean =>
      hasAnyPermission(userProfile?.permissions ?? [], permissions),

    hasAll: (permissions: Permission[]): boolean =>
      hasAllPermissions(userProfile?.permissions ?? [], permissions),

    role: role as UserRole | undefined,

    isCompanyLevel: (): boolean =>
      role ? isCompanyLevelRole(role) : false,

    isWorkspaceLevel: (): boolean =>
      role ? isWorkspaceLevelRole(role) : false,
  };
}
