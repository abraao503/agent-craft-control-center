import { Permission, UserRole } from "@/types/auth";

export function hasPermission(
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean {
  return userPermissions.includes(requiredPermission);
}

export function hasAnyPermission(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some((p) => userPermissions.includes(p));
}

export function hasAllPermissions(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every((p) => userPermissions.includes(p));
}

export function isCompanyLevelRole(role: UserRole): boolean {
  return ["PLATFORM_ADMIN", "COMPANY_OWNER", "COMPANY_ADMIN"].includes(role);
}

export function isWorkspaceLevelRole(role: UserRole): boolean {
  return [
    "WORKSPACE_OWNER",
    "WORKSPACE_ADMIN",
    "WORKSPACE_MANAGER",
    "WORKSPACE_MEMBER",
    "SALES_REP",
  ].includes(role);
}
