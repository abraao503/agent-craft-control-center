import { Permission } from "@/types/auth";
import { usePermissions } from "@/hooks/usePermissions";
import { ReactNode } from "react";

interface ProtectedComponentProps {
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function ProtectedComponent({
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  fallback = null,
  children,
}: ProtectedComponentProps) {
  const { has, hasAny, hasAll } = usePermissions();

  let hasAccess = true;

  if (requiredPermission) {
    hasAccess = has(requiredPermission);
  } else if (requiredPermissions) {
    hasAccess = requireAll
      ? hasAll(requiredPermissions)
      : hasAny(requiredPermissions);
  }

  return hasAccess ? <>{children}</> : fallback;
}
