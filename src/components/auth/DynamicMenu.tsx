import { Permission } from "@/types/auth";
import { usePermissions } from "@/hooks/usePermissions";
import { ReactNode } from "react";

export interface MenuItem {
  label: string;
  path: string;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAll?: boolean;
  icon?: ReactNode;
}

interface DynamicMenuProps {
  items: MenuItem[];
  renderItem: (item: MenuItem) => ReactNode;
}

export function DynamicMenu({ items, renderItem }: DynamicMenuProps) {
  const { has, hasAny, hasAll } = usePermissions();

  const visibleItems = items.filter((item) => {
    if (item.requiredPermission) {
      return has(item.requiredPermission);
    }
    if (item.requiredPermissions) {
      return item.requireAll
        ? hasAll(item.requiredPermissions)
        : hasAny(item.requiredPermissions);
    }
    return true;
  });

  return <>{visibleItems.map(renderItem)}</>;
}
