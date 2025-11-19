import { Permission } from "@/types/auth";

export interface SidebarMenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAll?: boolean;
}

export function filterSidebarItems(
  items: SidebarMenuItem[],
  hasPermission: (permission: Permission) => boolean,
  hasAnyPermission: (permissions: Permission[]) => boolean,
  hasAllPermissions: (permissions: Permission[]) => boolean
): SidebarMenuItem[] {
  return items.filter((item) => {
    if (item.requiredPermission) {
      return hasPermission(item.requiredPermission);
    }
    if (item.requiredPermissions) {
      return item.requireAll
        ? hasAllPermissions(item.requiredPermissions)
        : hasAnyPermission(item.requiredPermissions);
    }
    return true;
  });
}
